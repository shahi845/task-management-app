import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email: string, otp: string) => {
  const { error } = await resend.emails.send({
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
};