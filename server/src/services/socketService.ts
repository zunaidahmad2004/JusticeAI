import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface TokenPayload { id: string; email: string; role: string; }

export interface RealtimeNotification {
  type:       'case_assigned' | 'evidence_uploaded' | 'deadline_reminder' |
              'court_hearing' | 'ai_analysis_complete' | 'case_update' | 'system';
  title:      string;
  message?:   string;
  case_id?:   string;
  user_id?:   string;   // target user (undefined = broadcast to all)
  metadata?:  Record<string, unknown>;
}

/* ─── Module-level reference ─────────────────────────────────────────────── */
let _io: SocketServer | null = null;

/* ─── Init ───────────────────────────────────────────────────────────────── */
export function initSocketService(io: SocketServer): void {
  _io = io;

  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) { next(new Error('No token')); return; }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev-secret'
      ) as TokenPayload;

      (socket as any).userId = payload.id;
      (socket as any).role   = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    logger.info(`Socket connected: ${userId}`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role room for broadcasts
    const role = (socket as any).role as string;
    if (role) socket.join(`role:${role}`);

    socket.on('join_case', (caseId: string) => {
      socket.join(`case:${caseId}`);
    });

    socket.on('leave_case', (caseId: string) => {
      socket.leave(`case:${caseId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  logger.info('Socket.io service initialized');
}

/* ─── Emit helpers ───────────────────────────────────────────────────────── */

/** Send to a specific user */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!_io) return;
  _io.to(`user:${userId}`).emit(event, data);
}

/** Send to all users watching a specific case */
export function emitToCase(caseId: string, event: string, data: unknown): void {
  if (!_io) return;
  _io.to(`case:${caseId}`).emit(event, data);
}

/** Broadcast to all connected clients */
export function broadcast(event: string, data: unknown): void {
  if (!_io) return;
  _io.emit(event, data);
}

/** High-level: send a real-time notification */
export function sendRealtimeNotification(notif: RealtimeNotification): void {
  if (!_io) return;

  const payload = {
    ...notif,
    timestamp: new Date().toISOString(),
  };

  if (notif.user_id) {
    // Targeted notification
    _io.to(`user:${notif.user_id}`).emit('notification', payload);
  } else {
    // Broadcast (e.g. system-wide deadlines)
    _io.emit('notification', payload);
  }

  if (notif.case_id) {
    _io.to(`case:${notif.case_id}`).emit('case_update', payload);
  }
}
