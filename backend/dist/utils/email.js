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
exports.sendOtpEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendOtpEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transporter.sendMail({
            from: `"TaskFlow" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your TaskFlow verification code',
            html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 480px;
          margin: 0 auto;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">
          <h2 style="color: #4f46e5;">
            TaskFlow Email Verification
          </h2>

          <p>Your verification code is:</p>

          <h1 style="
            letter-spacing: 12px;
            font-size: 40px;
            color: #111827;
          ">
            ${otp}
          </h1>

          <p style="color: #6b7280;">
            This code expires in 10 minutes.
          </p>

          <p style="color: #6b7280;">
            If you didn't request this code, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} TaskFlow
          </p>
        </div>
      `,
        });
        console.log(`[OTP email] Sent successfully to ${email}`);
    }
    catch (error) {
        console.error('[Gmail SMTP error]', error);
        throw new Error("We couldn't send the verification code. Please try again.");
    }
});
exports.sendOtpEmail = sendOtpEmail;
