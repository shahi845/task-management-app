import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  try {
    await transporter.sendMail({
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
  } catch (error) {
    console.error('[Gmail SMTP error]', error);

    throw new Error(
      "We couldn't send the verification code. Please try again."
    );
  }
};