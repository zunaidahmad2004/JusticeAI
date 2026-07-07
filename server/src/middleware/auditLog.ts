import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import AuditLog from '../models/AuditLog';

export const auditLog = (action: string, resourceType: string) =>
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          action,
          resource_type: resourceType,
          resource_id: req.params.id || undefined,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
        });
      }
    } catch {
      // Don't block request on audit failure
    }
    next();
  };
