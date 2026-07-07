import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import AuditLog from '../models/AuditLog';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const generateTokens = (userId: string, email: string, role: string) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh';
  const accessOpts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
  const refreshOpts: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as SignOptions['expiresIn'] };
  const accessToken = jwt.sign({ id: userId, email, role }, secret, accessOpts);
  const refreshToken = jwt.sign({ id: userId }, refreshSecret, refreshOpts);
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').trim().notEmpty(),
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
        role: role || 'police_officer',
        badge_number, department, station, phone,
      });

      const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
      await RefreshToken.create({
        user_id: user._id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const { password_hash: _, two_factor_secret: __, ...safeUser } = user.toObject();
      res.status(201).json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email, is_active: true });
      if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

      user.last_login = new Date();
      await user.save();

      const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
      await RefreshToken.create({
        user_id: user._id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await AuditLog.create({ user_id: user._id, action: 'LOGIN', ip_address: req.ip, user_agent: req.get('user-agent') });

      const { password_hash: _, two_factor_secret: __, ...safeUser } = user.toObject();
      res.json({ user: safeUser, accessToken, refreshToken, requiresTwoFactor: user.two_factor_enabled });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[LOGIN ERROR]', msg);
      res.status(500).json({ error: 'Login failed', detail: msg });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id).select('-password_hash -two_factor_secret');
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(401).json({ error: 'Refresh token required' }); return; }
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh';
    const decoded = jwt.verify(refreshToken, secret) as { id: string };
    const stored = await RefreshToken.findOne({ token: refreshToken, expires_at: { $gt: new Date() } });
    if (!stored) { res.status(401).json({ error: 'Invalid or expired refresh token' }); return; }

    const user = await User.findOne({ _id: decoded.id, is_active: true });
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const tokens = generateTokens(String(user._id), user.email, user.role);
    res.json(tokens);
  } catch (_err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
  res.json({ message: 'Logged out successfully' });
});

// PUT /api/auth/change-password
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

export default router;
