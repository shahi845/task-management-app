import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
      to: email,
      subject: 'Your TaskFlow verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">TaskFlow Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 12px; font-size: 40px; color: #111827;">${otp}</h1>
          <p style="color: #6b7280;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      // Log the raw provider error for debugging — never expose to client
      console.error('[Resend error]', error);
      throw new Error(
        "We couldn't send the verification code. Please check your email address and try again."
      );
    }
  } catch (err: any) {
    // Re-wrap only if this isn't already our sanitized error
    if (err.message?.startsWith("We couldn't send")) {
      throw err;
    }
    console.error('[sendOtpEmail unexpected error]', err);
    throw new Error(
      "We couldn't send the verification code. Please check your email address and try again."
    );
  }
};