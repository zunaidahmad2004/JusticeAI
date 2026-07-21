import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthUser {
  id:        string;
  email:     string;
  role:      string;
  full_name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/* ─── In-memory auth cache ───────────────────────────────────────────────────
 * Caches verified user records for 5 minutes keyed by JWT token.
 * Eliminates the MongoDB User.findOne() on every single authenticated request.
 * Cache is invalidated when the TTL expires or the user is inactive.
 * ─────────────────────────────────────────────────────────────────────────── */
interface CacheEntry {
  user:      AuthUser;
  expiresAt: number;          // epoch ms
}

const AUTH_CACHE     = new Map<string, CacheEntry>();
const CACHE_TTL_MS   = 5 * 60 * 1000;  // 5 minutes
const MAX_CACHE_SIZE = 500;             // prevent unbounded growth

function pruneCache() {
  if (AUTH_CACHE.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of AUTH_CACHE.entries()) {
    if (entry.expiresAt < now) AUTH_CACHE.delete(key);
    if (AUTH_CACHE.size <= MAX_CACHE_SIZE) break;
  }
}

/* ─── Invalidate a specific user from the cache (e.g. after role change) ── */
export function invalidateUserCache(userId: string) {
  for (const [key, entry] of AUTH_CACHE.entries()) {
    if (entry.user.id === userId) AUTH_CACHE.delete(key);
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7); // faster than split

    // ── Check cache first ───────────────────────────────────────────────────
    const cached = AUTH_CACHE.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    // ── Verify JWT (CPU-only, no DB) ────────────────────────────────────────
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as AuthUser;

    // ── Single DB lookup, only on cache miss ────────────────────────────────
    const user = await User
      .findOne({ _id: decoded.id, is_active: true })
      .select('_id email role full_name')
      .lean();

    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    const authUser: AuthUser = {
      id:        String(user._id),
      email:     user.email     as string,
      role:      user.role      as string,
      full_name: user.full_name as string,
    };

    // ── Store in cache ──────────────────────────────────────────────────────
    pruneCache();
    AUTH_CACHE.set(token, { user: authUser, expiresAt: Date.now() + CACHE_TTL_MS });

    req.user = authUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user)                          { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!roles.includes(req.user.role))     { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    next();
  };
