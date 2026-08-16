const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter using SendGrid SMTP or generic SMTP
  // The user should set SMTP_HOST='smtp.sendgrid.net', SMTP_PORT=587,
  // SMTP_USER='apikey', and SMTP_PASS='<sendgrid_api_key>' in backend/.env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'SpendWise'} <${process.env.FROM_EMAIL || 'noreply@spendwise.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
