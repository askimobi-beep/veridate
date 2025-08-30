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

const sendRegistrationEmail = async (to, name) => {
  const mailOptions = {
    from: `"Relatia" <${process.env.GMAIL_USER}>`,
    to,
    subject: "👋 Welcome to Relatia – Set Your Password",
    html: `
      <div style="background: linear-gradient(to right, #1f1c2c, #928dab); padding: 40px; font-family: 'Segoe UI', sans-serif;">
        <div style="max-width: 500px; margin: auto; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; color: #fff; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);">
          <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">🎉 Welcome, ${name}!</h2>
          <h3 style="text-align: center; font-size: 18px; margin-bottom: 20px;">📧 ${to}</h3>
          <p style="font-size: 16px; line-height: 1.5;">
            You're almost ready to start using <strong>Relatia</strong>. 
            To get started, you'll need to set your password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/set-password?email=${encodeURIComponent(to)}" 
              style="background: #00c6ff; background: linear-gradient(to right, #0072ff, #00c6ff); color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              🔐 Set Your Password
            </a>
          </div>
          <p style="font-size: 14px; opacity: 0.8;">
            If you did not request this registration, please ignore this email or contact support.
          </p>
          <hr style="border-color: rgba(255, 255, 255, 0.2); margin: 30px 0;" />
          <p style="font-size: 13px; opacity: 0.7; text-align: center;">
            Need help? Contact us at <a href="mailto:support@relatia.com" style="color: #aad4ff;">support@relatia.com</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendForgotPasswordEmail = async (to, otp) => {
  const mailOptions = {
    from: `Relatia <${process.env.GMAIL_USER}>`,
    to,
    subject: "🔐 Reset Your Relatia Password",
    html: `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333">Reset Your Password</h2>
        <p>We received a request to reset your password. Use the OTP below to proceed:</p>
        <h1 style="color: #007bff">${otp}</h1>
        <p>This OTP is valid for 10 minutes. If you didn’t request this, just ignore this email.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};


module.exports = { sendRegistrationEmail , sendForgotPasswordEmail };
