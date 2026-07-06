import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'alerts@umbra.io';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'UMBRA Intelligence';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not set. Mocking email send to:', options.to);
    console.log(`[Email] Subject: ${options.subject}`);
    return true;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const getAlertEmailTemplate = (
  domain: string,
  breachName: string,
  severity: string,
  dashboardUrl: string
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <h2 style="color: ${severity === 'critical' || severity === 'high' ? '#e53e3e' : '#3182ce'};">
      UMBRA Alert: New Breach Detected
    </h2>
    <p>A new breach involving <strong>${domain}</strong> was detected in our intelligence feeds.</p>
    <div style="background: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Source:</strong> ${breachName}</p>
      <p style="margin: 5px 0 0 0;"><strong>Severity:</strong> <span style="text-transform: capitalize;">${severity}</span></p>
    </div>
    <p>Please review the full incident details and AI remediation summary on your dashboard.</p>
    <a href="${dashboardUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
      View in Dashboard
    </a>
  </div>
`;

export const getVerificationEmailTemplate = (verifyUrl: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <h2>Welcome to UMBRA</h2>
    <p>Please verify your email address to complete your registration.</p>
    <a href="${verifyUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
      Verify Email
    </a>
  </div>
`;
