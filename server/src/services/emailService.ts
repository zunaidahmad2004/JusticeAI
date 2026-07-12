import { logger } from '../utils/logger';

/* ─── Lazy-load nodemailer so missing package doesn't crash server ─────────── */
let transporter: any = null;

async function getTransporter() {
  if (transporter) return transporter;
  try {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: { rejectUnauthorized: false },
    });
    return transporter;
  } catch {
    return null;
  }
}

const FROM = process.env.SMTP_FROM || 'JusticeAI <noreply@justiceai.gov.in>';

/* ─── Send 2FA OTP Email ─────────────────────────────────────────────────── */
export async function sendOTPEmail(params: {
  to:       string;
  name:     string;
  otp:      string;
  purpose:  'login_2fa' | 'email_verify' | 'password_reset';
  ip?:      string;
}): Promise<boolean> {
  const subjectMap = {
    login_2fa:       'JusticeAI — Your Login Verification Code',
    email_verify:    'JusticeAI — Verify Your Email Address',
    password_reset:  'JusticeAI — Password Reset Code',
  };

  const purposeText = {
    login_2fa:      'sign in to your account',
    email_verify:   'verify your email address',
    password_reset: 'reset your password',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0B1220; color: #E2E8F0; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; padding: 0 20px; }
    .card { background: #131820; border: 1px solid #1E2533; border-radius: 20px; padding: 40px; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg,#4338CA,#6366F1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 18px; font-weight: 700; color: #fff; }
    .logo-sub { font-size: 11px; color: #64748B; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px; }
    p { font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: #0F172A; border: 2px solid #6366F1; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6366F1; font-family: 'Courier New', monospace; }
    .otp-label { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; }
    .expiry { background: #1A2332; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #F59E0B; margin: 16px 0; }
    .meta { font-size: 12px; color: #475569; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1E2533; }
    .warning { background: #2D1B1B; border: 1px solid #7F1D1D; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #FCA5A5; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">🛡️</div>
        <div>
          <div class="logo-text">JusticeAI</div>
          <div class="logo-sub">Investigation Platform</div>
        </div>
      </div>

      <h1>Verification Code</h1>
      <p>Hello <strong style="color:#fff">${params.name}</strong>,</p>
      <p>Your one-time verification code to <strong style="color:#fff">${purposeText[params.purpose]}</strong> is:</p>

      <div class="otp-box">
        <div class="otp-code">${params.otp}</div>
        <div class="otp-label">One-Time Password</div>
      </div>

      <div class="expiry">⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>

      ${params.ip ? `<p style="font-size:12px;color:#64748B;">Request from IP: ${params.ip}</p>` : ''}

      <div class="warning">
        ⚠ If you did not request this code, your account may be at risk. 
        Contact your system administrator immediately and do not share this code.
      </div>

      <div class="meta">
        This is an automated message from JusticeAI Investigation Platform.<br>
        For authorized law enforcement and legal personnel only.<br>
        All access is logged and monitored.
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `JusticeAI — Verification Code\n\nHello ${params.name},\n\nYour verification code is: ${params.otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, contact your system administrator immediately.`;

  // Try to send real email
  const mailer = await getTransporter();
  if (mailer && process.env.SMTP_USER) {
    try {
      await mailer.sendMail({
        from:    FROM,
        to:      params.to,
        subject: subjectMap[params.purpose],
        html,
        text,
      });
      logger.info(`OTP email sent to ${params.to} [${params.purpose}]`);
      return true;
    } catch (err) {
      logger.warn(`Email send failed: ${String(err).substring(0, 150)}`);
    }
  }

  // Development fallback — log OTP to console
  logger.info(`[DEV MODE] OTP for ${params.to}: ${params.otp} [${params.purpose}]`);
  logger.info('Configure SMTP_USER + SMTP_PASS in server/.env to send real emails.');
  return false; // returns false but OTP is still created in DB
}

/* ─── Trusted device notification ───────────────────────────────────────── */
export async function sendTrustedDeviceEmail(params: {
  to:     string;
  name:   string;
  device: string;
  ip?:    string;
}): Promise<void> {
  const mailer = await getTransporter();
  if (!mailer || !process.env.SMTP_USER) {
    logger.info(`[DEV MODE] New trusted device for ${params.to}: ${params.device}`);
    return;
  }
  try {
    await mailer.sendMail({
      from: FROM,
      to:   params.to,
      subject: 'JusticeAI — New Trusted Device Added',
      text: `Hello ${params.name},\n\nA new device has been trusted for your JusticeAI account:\n\nDevice: ${params.device}\nIP: ${params.ip || 'Unknown'}\nTime: ${new Date().toLocaleString('en-IN')}\n\nIf this was not you, revoke this device immediately in your account settings.`,
    });
  } catch (err) {
    logger.warn(`Trusted device email failed: ${String(err).substring(0, 100)}`);
  }
}
