import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export interface RealtimeNotif {
  type: string;
  title: string;
  message?: string;
  case_id?: string;
  timestamp: string;
}

type Handler = (notif: RealtimeNotif) => void;

let _socket: Socket | null = null;

export function useRealtimeNotifications(onNotification?: Handler) {
  const token        = useAuthStore((s) => s.accessToken);
  const isAuth       = useAuthStore((s) => s.isAuthenticated);
  const handlerRef   = useRef<Handler | undefined>(onNotification);

  useEffect(() => { handlerRef.current = onNotification; }, [onNotification]);

  const connect = useCallback(() => {
    if (!token || !isAuth) return;
    if (_socket?.connected) return;

    _socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    _socket.on('connect', () => {
      console.info('[Socket] Connected');
    });

    _socket.on('notification', (notif: RealtimeNotif) => {
      // Show toast
      const icon =
        notif.type === 'court_hearing'       ? '⚖️' :
        notif.type === 'evidence_uploaded'   ? '📎' :
        notif.type === 'case_assigned'       ? '📁' :
        notif.type === 'ai_analysis_complete'? '🤖' :
        notif.type === 'deadline_reminder'   ? '⏰' : '🔔';

      toast(`${icon} ${notif.title}${notif.message ? ' — ' + notif.message : ''}`, {
        duration: 5000,
        style: {
          background: '#131820',
          color: '#F1F5F9',
          border: '1px solid #1E2533',
          borderRadius: '12px',
          fontSize: '13px',
        },
      });

      handlerRef.current?.(notif);
    });

    _socket.on('case_update', (data: RealtimeNotif) => {
      handlerRef.current?.(data);
    });

    _socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
    });

    _socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }, [token, isAuth]);

  useEffect(() => {
    connect();
    return () => {
      // Don't disconnect on unmount — keep socket alive across navigation
      // Only disconnect on logout (handled by authStore)
    };
  }, [connect]);

  const joinCase = useCallback((caseId: string) => {
    _socket?.emit('join_case', caseId);
  }, []);

  const leaveCase = useCallback((caseId: string) => {
    _socket?.emit('leave_case', caseId);
  }, []);

  const disconnect = useCallback(() => {
    _socket?.disconnect();
    _socket = null;
  }, []);

  return { joinCase, leaveCase, disconnect };
}
