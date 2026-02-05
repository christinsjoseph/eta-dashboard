import { transporter } from "../config/emailConfig.js";

export async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: "ETA Dashboard <noreply.etadashboard@gmail.com>",
    to: email,
    subject: "Your OTP Code - ETA Dashboard",
    html: `
      <h2>ETA Dashboard OTP Verification</h2>
      <p>Your OTP code is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
}
