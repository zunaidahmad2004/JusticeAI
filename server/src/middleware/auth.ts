import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
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

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as AuthUser;

    const user = await User.findOne({ _id: decoded.id, is_active: true }).select('id email role full_name is_active');
    if (!user) { res.status(401).json({ error: 'User not found or inactive' }); return; }

    req.user = { id: String(user._id), email: user.email, role: user.role, full_name: user.full_name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    next();
  };
