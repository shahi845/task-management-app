"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.resendOtp = exports.verifyOtp = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const email_1 = require("../utils/email");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10);
const OTP_RESEND_MAX = 3; // max resend attempts per window
const OTP_RESEND_WINDOW_MS = 15 * 60 * 1000; // 15-minute window
const OTP_RESEND_COOLDOWN_S = 60; // seconds the client must wait between resends
/** Generate a 6-digit OTP, return plaintext + bcrypt hash */
const generateOtp = () => __awaiter(void 0, void 0, void 0, function* () {
    const plaintext = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = yield bcrypt_1.default.hash(plaintext, 10);
    return { plaintext, hashed };
});
/** Build a JWT for a verified user */
const signToken = (userId) => jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
// ---------------------------------------------------------------------------
// Register
// P1 — Correct flow order: generate OTP → send email → upsert user
// P2 — Hash OTP before storage
// P5 — Email enumeration protection
// P8 — Sanitised email errors (thrown by sendOtpEmail)
// ---------------------------------------------------------------------------
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { email: validatedData.email }
        });
        // P5: If already verified → generic response (no enumeration)
        if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.emailVerified) {
            return res.status(200).json({
                success: true,
                message: 'If this email is available, a verification code has been sent.',
                data: { email: validatedData.email }
            });
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(validatedData.password, salt);
        const { plaintext: otp, hashed: otpHash } = yield generateOtp();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
        // P1: Send email FIRST — if it throws, we do NOT touch the database
        yield (0, email_1.sendOtpEmail)(validatedData.email, otp);
        // Only persist after a successful send
        if (existingUser) {
            // P5: Unverified account exists — refresh OTP silently
            yield prisma_1.default.user.update({
                where: { id: existingUser.id },
                data: {
                    passwordHash,
                    otpCode: otpHash,
                    otpExpiresAt,
                    otpRequestCount: 1,
                    otpWindowStart: new Date(),
                }
            });
        }
        else {
            yield prisma_1.default.user.create({
                data: {
                    name: validatedData.name,
                    email: validatedData.email,
                    passwordHash,
                    otpCode: otpHash,
                    otpExpiresAt,
                    emailVerified: false,
                    otpRequestCount: 1,
                    otpWindowStart: new Date(),
                }
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Verification code sent to your email',
            data: { email: validatedData.email }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.register = register;
// ---------------------------------------------------------------------------
// Login
// P6 — Block unverified accounts
// ---------------------------------------------------------------------------
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = yield prisma_1.default.user.findUnique({
            where: { email: validatedData.email }
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = yield bcrypt_1.default.compare(validatedData.password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        // P6: Require email verification before issuing JWT
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in.',
                requiresVerification: true,
                data: { email: user.email }
            });
        }
        const token = signToken(user.id);
        return res.json({
            success: true,
            message: 'Logged in successfully',
            data: {
                token,
                user: { id: user.id, name: user.name, email: user.email }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
// ---------------------------------------------------------------------------
// Verify OTP
// P2 — bcrypt.compare against stored hash
// P3 — Expiry enforced
// ---------------------------------------------------------------------------
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }
        if (!user.otpCode || !user.otpExpiresAt) {
            return res.status(400).json({ success: false, message: 'No verification code found' });
        }
        // P3: Check expiry
        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }
        // P2: Compare against hashed OTP
        const isValidOtp = yield bcrypt_1.default.compare(otp, user.otpCode);
        if (!isValidOtp) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                otpCode: null,
                otpExpiresAt: null,
                otpRequestCount: 0,
                otpWindowStart: null,
            }
        });
        const token = signToken(updatedUser.id);
        return res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                token,
                user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyOtp = verifyOtp;
// ---------------------------------------------------------------------------
// Resend OTP
// P4 — Max 3 resends per 15-minute window, server-enforced
// ---------------------------------------------------------------------------
const resendOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal whether the email exists
            return res.status(200).json({
                success: true,
                message: 'If your account exists, a new code has been sent.'
            });
        }
        if (user.emailVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }
        // P4: Rate limiting — reset window if it has expired
        const now = new Date();
        const windowStart = (_a = user.otpWindowStart) !== null && _a !== void 0 ? _a : now;
        const windowAge = now.getTime() - windowStart.getTime();
        let requestCount = windowAge > OTP_RESEND_WINDOW_MS ? 0 : user.otpRequestCount;
        if (requestCount >= OTP_RESEND_MAX) {
            const retryAfterMs = OTP_RESEND_WINDOW_MS - windowAge;
            const retryAfterMin = Math.ceil(retryAfterMs / 60000);
            return res.status(429).json({
                success: false,
                message: `Too many verification requests. Please try again in ${retryAfterMin} minute${retryAfterMin !== 1 ? 's' : ''}.`
            });
        }
        const { plaintext: otp, hashed: otpHash } = yield generateOtp();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
        // Send email first — abort if it fails
        yield (0, email_1.sendOtpEmail)(email, otp);
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                otpCode: otpHash,
                otpExpiresAt,
                otpRequestCount: requestCount + 1,
                otpWindowStart: windowAge > OTP_RESEND_WINDOW_MS ? now : windowStart,
            }
        });
        return res.json({
            success: true,
            message: 'New verification code sent to your email',
            data: {
                email,
                cooldownSeconds: OTP_RESEND_COOLDOWN_S,
                attemptsLeft: OTP_RESEND_MAX - (requestCount + 1)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.resendOtp = resendOtp;
// ---------------------------------------------------------------------------
// getMe
// ---------------------------------------------------------------------------
const getMe = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({
            success: true,
            data: { id: user.id, name: user.name, email: user.email }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getMe = getMe;
// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
const logout = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ success: true, message: 'Logged out successfully' });
});
exports.logout = logout;
