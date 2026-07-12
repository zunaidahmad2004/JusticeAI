import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import AuditLog from '../models/AuditLog';
import OTPCode from '../models/OTPCode';
import TrustedDevice from '../models/TrustedDevice';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendOTPEmail, sendTrustedDeviceEmail } from '../services/emailService';
import { logger } from '../utils/logger';

const router = Router();

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const JWT_SECRET         = () => process.env.JWT_SECRET         || 'fallback_secret_change_in_production';
const JWT_REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET || 'fallback_refresh_change_in_production';
const JWT_EXPIRES        = () => (process.env.JWT_EXPIRES_IN         || '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES= () => (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as SignOptions['expiresIn'];

function generateTokens(userId: string, email: string, role: string) {
  const accessToken  = jwt.sign({ id: userId, email, role }, JWT_SECRET(),  { expiresIn: JWT_EXPIRES() });
  const refreshToken = jwt.sign({ id: userId },               JWT_REFRESH_SECRET(), { expiresIn: JWT_REFRESH_EXPIRES() });
  return { accessToken, refreshToken };
}

function generateOTP(): string {
  // 6-digit cryptographically secure OTP
  return String(crypto.randomInt(100000, 999999));
}

function parseUserAgent(ua: string = ''): string {
  // Simplified device name extraction
  const browser  = ua.includes('Chrome')  ? 'Chrome'  :
                   ua.includes('Firefox') ? 'Firefox' :
                   ua.includes('Safari')  ? 'Safari'  :
                   ua.includes('Edge')    ? 'Edge'    : 'Browser';
  const os       = ua.includes('Windows') ? 'Windows' :
                   ua.includes('Mac')     ? 'macOS'   :
                   ua.includes('Linux')   ? 'Linux'   :
                   ua.includes('Android') ? 'Android' :
                   ua.includes('iPhone')  ? 'iPhone'  : 'Unknown OS';
  return `${browser} on ${os}`;
}

async function saveRefreshToken(userId: string, token: string) {
  await RefreshToken.create({
    user_id:    userId,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}

function stripSensitive(user: any) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password_hash;
  delete obj.two_factor_secret;
  return obj;
}

/* ═══════════════════════════════════════════════════════════════════════════
   REGISTER
   ═══════════════════════════════════════════════════════════════════════════ */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { email, password, full_name, role, badge_number, department, station, phone } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }

      const password_hash = await bcrypt.hash(password, 12);
      const user = await User.create({
        email, password_hash, full_name,
        role:         role || 'police_officer',
        badge_number, department, station, phone,
      });

      const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
      await saveRefreshToken(String(user._id), refreshToken);

      res.status(201).json({ user: stripSensitive(user), accessToken, refreshToken, requiresTwoFactor: false });
    } catch (err: unknown) {
      logger.error('Registration failed', { err: String(err).substring(0, 200) });
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN — Step 1: Validate credentials
   ═══════════════════════════════════════════════════════════════════════════ */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { email, password, device_token } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || '';

    try {
      const user = await User.findOne({ email, is_active: true });
      if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        await AuditLog.create({ user_id: user._id, action: 'LOGIN_FAILED', ip_address: ip, user_agent: ua });
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // ── Check if 2FA is enabled ────────────────────────────────────────
      if (user.two_factor_enabled) {

        // Check trusted device first
        if (device_token) {
          const trusted = await TrustedDevice.findOne({
            user_id:      user._id,
            device_token,
            is_revoked:   false,
            expires_at:   { $gt: new Date() },
          });
          if (trusted) {
            // Trusted device — skip 2FA, log in directly
            trusted.last_used = new Date();
            await trusted.save();
            user.last_login = new Date();
            await user.save();
            const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
            await saveRefreshToken(String(user._id), refreshToken);
            await AuditLog.create({ user_id: user._id, action: 'LOGIN', ip_address: ip, user_agent: ua });
            res.json({ user: stripSensitive(user), accessToken, refreshToken, requiresTwoFactor: false, trusted_device: true });
            return;
          }
        }

        // Generate and send OTP
        const rawOTP   = generateOTP();
        const otpHash  = await bcrypt.hash(rawOTP, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate any existing unused OTPs for this user
        await OTPCode.updateMany(
          { user_id: user._id, purpose: 'login_2fa', used: false },
          { used: true }
        );

        await OTPCode.create({
          user_id:    user._id,
          email:      user.email,
          code:       otpHash,
          purpose:    'login_2fa',
          expires_at: expiresAt,
          ip_address: ip,
        });

        // Send email (non-blocking — OTP is in DB regardless)
        sendOTPEmail({ to: user.email, name: user.full_name, otp: rawOTP, purpose: 'login_2fa', ip }).catch(() => {});

        res.json({
          requiresTwoFactor: true,
          user_id:           String(user._id),
          email_hint:        user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          message:           'Verification code sent to your registered email address.',
        });
        return;
      }

      // ── No 2FA — direct login ──────────────────────────────────────────
      user.last_login = new Date();
      await user.save();
      const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
      await saveRefreshToken(String(user._id), refreshToken);
      await AuditLog.create({ user_id: user._id, action: 'LOGIN', ip_address: ip, user_agent: ua });
      res.json({ user: stripSensitive(user), accessToken, refreshToken, requiresTwoFactor: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('[LOGIN ERROR]', { msg });
      res.status(500).json({ error: 'Login failed', detail: msg });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN — Step 2: Verify OTP
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { user_id, otp, remember_device } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ua = req.get('user-agent') || '';

  if (!user_id || !otp) { res.status(400).json({ error: 'user_id and otp are required' }); return; }

  try {
    const user = await User.findOne({ _id: user_id, is_active: true });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // Find valid, unused OTP
    const otpRecord = await OTPCode.findOne({
      user_id,
      purpose:    'login_2fa',
      used:       false,
      expires_at: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      res.status(401).json({ error: 'Verification code not found or expired. Please request a new code.' }); return;
    }

    // Brute-force protection — max 5 attempts
    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      res.status(429).json({ error: 'Too many failed attempts. Please sign in again to receive a new code.' }); return;
    }

    const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.code);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      res.status(401).json({ error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` }); return;
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Update last login
    user.last_login = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
    await saveRefreshToken(String(user._id), refreshToken);
    await AuditLog.create({ user_id: user._id, action: 'LOGIN_2FA_SUCCESS', ip_address: ip, user_agent: ua });

    // Remember trusted device if requested
    let newDeviceToken: string | null = null;
    if (remember_device) {
      newDeviceToken = crypto.randomBytes(48).toString('hex');
      const deviceName = parseUserAgent(ua);
      await TrustedDevice.create({
        user_id:      user._id,
        device_token: newDeviceToken,
        device_name:  deviceName,
        ip_address:   ip,
        user_agent:   ua,
        expires_at:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      sendTrustedDeviceEmail({ to: user.email, name: user.full_name, device: deviceName, ip }).catch(() => {});
    }

    res.json({
      user:              stripSensitive(user),
      accessToken,
      refreshToken,
      requiresTwoFactor: false,
      ...(newDeviceToken ? { device_token: newDeviceToken } : {}),
    });
  } catch (err: unknown) {
    logger.error('OTP verification failed', { err: String(err).substring(0, 200) });
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   RESEND OTP
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  const { user_id } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!user_id) { res.status(400).json({ error: 'user_id is required' }); return; }

  try {
    const user = await User.findOne({ _id: user_id, is_active: true });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // Rate limit — only 1 resend per 60 seconds
    const recent = await OTPCode.findOne({
      user_id, purpose: 'login_2fa', used: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recent) {
      res.status(429).json({ error: 'Please wait 60 seconds before requesting a new code.' }); return;
    }

    // Invalidate old OTPs
    await OTPCode.updateMany({ user_id, purpose: 'login_2fa', used: false }, { used: true });

    const rawOTP = generateOTP();
    const otpHash = await bcrypt.hash(rawOTP, 10);
    await OTPCode.create({
      user_id: user._id, email: user.email,
      code: otpHash, purpose: 'login_2fa',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      ip_address: ip,
    });

    sendOTPEmail({ to: user.email, name: user.full_name, otp: rawOTP, purpose: 'login_2fa', ip }).catch(() => {});

    res.json({ message: 'New verification code sent.', email_hint: user.email.replace(/(.{2}).*(@.*)/, '$1***$2') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   GET ME / REFRESH / LOGOUT  (unchanged)
   ═══════════════════════════════════════════════════════════════════════════ */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id).select('-password_hash -two_factor_secret');
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(401).json({ error: 'Refresh token required' }); return; }
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET()) as { id: string };
    const stored  = await RefreshToken.findOne({ token: refreshToken, expires_at: { $gt: new Date() } });
    if (!stored) { res.status(401).json({ error: 'Invalid or expired refresh token' }); return; }
    const user = await User.findOne({ _id: decoded.id, is_active: true });
    if (!user)  { res.status(401).json({ error: 'User not found' }); return; }
    const tokens = generateTokens(String(user._id), user.email, user.role);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
  res.json({ message: 'Logged out successfully' });
});

router.put(
  '/change-password',
  authenticate,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const valid = await bcrypt.compare(req.body.currentPassword, user.password_hash);
    if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }
    user.password_hash = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   2FA MANAGEMENT (enable / disable / status)
   ═══════════════════════════════════════════════════════════════════════════ */

// GET /api/auth/2fa/status
router.get('/2fa/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id).select('two_factor_enabled email');
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const deviceCount = await TrustedDevice.countDocuments({ user_id: user._id, is_revoked: false, expires_at: { $gt: new Date() } });
  res.json({ two_factor_enabled: user.two_factor_enabled, trusted_devices: deviceCount });
});

// POST /api/auth/2fa/enable — sends verification OTP to email
router.post('/2fa/enable', authenticate, async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const ip = req.ip || 'unknown';
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (user.two_factor_enabled) { res.status(400).json({ error: '2FA is already enabled' }); return; }

    const rawOTP  = generateOTP();
    const otpHash = await bcrypt.hash(rawOTP, 10);
    await OTPCode.updateMany({ user_id: user._id, purpose: 'email_verify', used: false }, { used: true });
    await OTPCode.create({
      user_id: user._id, email: user.email,
      code: otpHash, purpose: 'email_verify',
      expires_at: new Date(Date.now() + 10 * 60 * 1000), ip_address: ip,
    });

    sendOTPEmail({ to: user.email, name: user.full_name, otp: rawOTP, purpose: 'email_verify', ip }).catch(() => {});

    res.json({ message: 'Verification code sent to your email. Enter it to activate 2FA.', email_hint: user.email.replace(/(.{2}).*(@.*)/, '$1***$2') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate 2FA setup' });
  }
});

// POST /api/auth/2fa/confirm — verify OTP and activate 2FA
router.post('/2fa/confirm', authenticate, async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { otp } = req.body;
  if (!otp) { res.status(400).json({ error: 'OTP is required' }); return; }
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const otpRecord = await OTPCode.findOne({
      user_id: user._id, purpose: 'email_verify',
      used: false, expires_at: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) { res.status(401).json({ error: 'Code expired or not found. Please request a new code.' }); return; }

    if (otpRecord.attempts >= 5) {
      otpRecord.used = true; await otpRecord.save();
      res.status(429).json({ error: 'Too many failed attempts. Please start over.' }); return;
    }

    const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.code);
    if (!isValid) {
      otpRecord.attempts += 1; await otpRecord.save();
      res.status(401).json({ error: `Invalid code. ${5 - otpRecord.attempts} attempts remaining.` }); return;
    }

    otpRecord.used = true; await otpRecord.save();
    user.two_factor_enabled = true;
    await user.save();

    res.json({ message: 'Two-factor authentication has been enabled successfully.', two_factor_enabled: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm 2FA' });
  }
});

// POST /api/auth/2fa/disable
router.post(
  '/2fa/disable',
  authenticate,
  [body('password').notEmpty()],
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    try {
      const user = await User.findById(req.user!.id);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      const valid = await bcrypt.compare(req.body.password, user.password_hash);
      if (!valid) { res.status(401).json({ error: 'Incorrect password' }); return; }

      user.two_factor_enabled = false;
      user.two_factor_secret  = undefined;
      await user.save();

      // Revoke all trusted devices on disable
      await TrustedDevice.updateMany({ user_id: user._id }, { is_revoked: true });

      res.json({ message: 'Two-factor authentication has been disabled. All trusted devices revoked.', two_factor_enabled: false });
    } catch (err) {
      res.status(500).json({ error: 'Failed to disable 2FA' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   TRUSTED DEVICES
   ═══════════════════════════════════════════════════════════════════════════ */

// GET /api/auth/trusted-devices
router.get('/trusted-devices', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const devices = await TrustedDevice.find({
    user_id:    req.user!.id,
    is_revoked: false,
    expires_at: { $gt: new Date() },
  }).sort({ last_used: -1 }).lean();
  res.json(devices.map((d) => ({ ...d, id: d._id })));
});

// DELETE /api/auth/trusted-devices/:id — revoke one device
router.delete('/trusted-devices/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await TrustedDevice.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!.id },
    { is_revoked: true }
  );
  res.json({ message: 'Device revoked successfully' });
});

// DELETE /api/auth/trusted-devices — revoke ALL devices
router.delete('/trusted-devices', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await TrustedDevice.updateMany({ user_id: req.user!.id }, { is_revoked: true });
  res.json({ message: 'All trusted devices revoked' });
});

export default router;
