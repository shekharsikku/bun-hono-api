import { Resend } from "resend";
import env from "./env";

const resend = new Resend(env.RESEND_API_KEY);
const sender = env.RESEND_ORIGIN;

export const sendVerificationEmail = async (email: string, otp: string) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Use the following One-Time Password (OTP) to verify your email:</p>
      <div style="font-size: 24px; font-weight: bold; background: #f3f3f3; padding: 10px; display: inline-block; border-radius: 5px;">
        ${otp}
      </div>
      <p style="margin-top: 10px;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Verify Your Email!",
      html: htmlContent,
    });
    return response;
  } catch (error: any) {
    console.log(`Error: sending mail ${error.message}`);
    return null;
  }
};
