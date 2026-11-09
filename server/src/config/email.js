const nodemailer = require('nodemailer');

let transporter = null;
let testAccount = null;

const initEmailTransporter = async () => {
  if (transporter) return transporter;

  // If explicit credentials are provided in env
  if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Email Service] Configured using environment SMTP credentials.');
    return transporter;
  }

  // Otherwise, use a graceful Ethereal test transporter or simulated transport
  try {
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Email Service] Ethereal test account created: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn(`[Email Service] Ethereal connection fallback to in-memory/logger transport: ${err.message}`);
    // Safe fallback mock transport
    transporter = {
      sendMail: async (mailOptions) => {
        console.log(`[Email Mock Log] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        return { messageId: `mock-${Date.now()}`, mock: true };
      },
    };
    return transporter;
  }
};

const getTransporter = () => transporter;

module.exports = {
  initEmailTransporter,
  getTransporter,
};

