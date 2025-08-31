const nodemailer = require("nodemailer");
require("dotenv").config();

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `Veridate <${process.env.GMAIL_USER}>`,
    to,
    subject: "🔐 Verify Your Email - Veridate",
    html: `
      <div style="background: linear-gradient(135deg, #f0f4ff, #f9f9ff); padding: 40px; font-family: 'Segoe UI', Tahoma, sans-serif; color: #333;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #eef1f7;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://cdn-icons-png.flaticon.com/512/942/942751.png" alt="Veridate" width="60" style="margin-bottom: 12px;" />
            <h2 style="font-size: 22px; font-weight: 700; color: #2d2d2d; margin: 0;">Verify Your Email</h2>
            <p style="font-size: 14px; color: #666; margin-top: 6px;">Secure your account with a one-time passcode</p>
          </div>

          <div style="background: linear-gradient(135deg, #6a11cb, #2575fc); color: white; text-align: center; border-radius: 12px; padding: 20px; font-size: 28px; font-weight: bold; letter-spacing: 4px;">
            ${otp}
          </div>

          <p style="margin-top: 24px; font-size: 15px; line-height: 1.6; text-align: center; color: #444;">
            Enter this code in the verification screen to complete your registration.
            <br/>
            This code will expire in <b>10 minutes</b>.
          </p>

        
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 13px; color: #777; text-align: center; margin: 0;">
            Didn’t request this code? You can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
