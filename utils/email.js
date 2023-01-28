const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

const sendEmail = catchAsync(async options => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const emailOptions = {
    from: 'unyime udoh <unyimeudoh20@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html
  };

  await transporter.sendMail(emailOptions);
});

module.exports = sendEmail;
