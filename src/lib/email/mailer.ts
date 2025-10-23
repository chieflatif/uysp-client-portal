/**
 * Email Utility - Gmail SMTP Integration
 * Sends transactional emails via Gmail OAuth
 */

import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM_EMAIL || 'noreply@uysp.com',
  fromName: process.env.SMTP_FROM_NAME || 'UYSP Portal',
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // Gmail SMTP configuration
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.SMTP_USER, // Your Gmail address
      pass: process.env.SMTP_PASSWORD, // App-specific password from Google
    },
  });

  return transporter;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send password setup invitation email
 */
export async function sendPasswordSetupEmail(
  email: string,
  firstName: string,
  setupUrl: string
): Promise<void> {
  const subject = 'Complete Your UYSP Portal Account Setup';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #5568d3; }
          .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }
          .requirements { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
          .requirements li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to UYSP Portal</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>

            <p>Your account has been created on the UYSP Lead Qualification Portal. To get started, you'll need to set up your password.</p>

            <div style="text-align: center;">
              <a href="${setupUrl}" class="button">Set Up Your Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">${setupUrl}</p>

            <div class="requirements">
              <strong>Password Requirements:</strong>
              <ul>
                <li>✓ At least 12 characters long</li>
                <li>✓ At least one uppercase letter (A-Z)</li>
                <li>✓ At least one lowercase letter (a-z)</li>
                <li>✓ At least one number (0-9)</li>
                <li>✓ At least one special character (!@#$%^&*)</li>
              </ul>
            </div>

            <p>This link will expire in 24 hours for security purposes.</p>

            <p>If you didn't expect this email, please ignore it or contact your administrator.</p>

            <p>Best regards,<br>The UYSP Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} UYSP. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  email: string,
  firstName: string
): Promise<void> {
  const subject = 'Your UYSP Portal Password Has Been Changed';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fed7d7; border-left: 4px solid #fc8181; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Password Changed</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>

            <p>Your UYSP Portal password was successfully changed.</p>

            <div class="alert">
              <strong>⚠️ Didn't make this change?</strong><br>
              If you didn't change your password, please contact your administrator immediately.
            </div>

            <p>For security purposes, you may be asked to log in again on your devices.</p>

            <p>Best regards,<br>The UYSP Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} UYSP. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}
