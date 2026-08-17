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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendOtpEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to: email,
        subject: 'Your TaskFlow verification code',
        html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>TaskFlow Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this code, you can ignore this email.</p>
      </div>
    `,
    });
    if (error) {
        throw new Error(error.message);
    }
});
exports.sendOtpEmail = sendOtpEmail;
