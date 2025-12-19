/**
 * Email Service Utility
 * Handles sending emails using Nodemailer
 * Configure SMTP settings in environment variables
 */

import nodemailer from 'nodemailer';

let transporter = null;

// Initialize transporter (cached for performance)
const initializeTransporter = () => {
  if (transporter) return transporter;

  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT || 587;

  if (emailHost) {
    // Custom SMTP server
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else if (emailService === 'gmail' && emailUser && emailPassword) {
    // Gmail
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else {
    console.warn('Email service not configured. Emails will not be sent.');
    return null;
  }

  return transporter;
};

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const mailer = initializeTransporter();
    if (!mailer) {
      console.warn('Email service not configured. Skipping send.');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await mailer.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send email to multiple recipients
 * @param {string[]} to - Recipient emails
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @returns {Promise<boolean>} - Success status
 */
export const sendBulkEmail = async (to, subject, html) => {
  try {
    const mailer = initializeTransporter();
    if (!mailer) {
      console.warn('Email service not configured. Skipping send.');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to.join(','),
      subject,
      html,
    };

    await mailer.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to.length} recipients`);
    return true;
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return false;
  }
};
