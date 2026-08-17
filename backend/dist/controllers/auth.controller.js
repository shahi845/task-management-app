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
exports.logout = exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const email_1 = require("../utils/email");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { email: validatedData.email }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already in use'
            });
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(validatedData.password, salt);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresInMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 10);
        const otpExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        yield prisma_1.default.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                passwordHash,
                otpCode: otp,
                otpExpiresAt,
                emailVerified: false
            }
        });
        yield (0, email_1.sendOtpEmail)(validatedData.email, otp);
        res.status(201).json({
            success: true,
            message: 'Verification code sent to your email',
            data: {
                email: validatedData.email
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.register = register;
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Logged in successfully',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
const getMe = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getMe = getMe;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Client should delete the token
    res.json({ success: true, message: 'Logged out successfully' });
});
exports.logout = logout;
