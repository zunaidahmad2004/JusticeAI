import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string; type: string; title: string;
  message?: string; is_read: boolean;
  action_url?: string; created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  case_update:       'bg-blue-500',
  evidence_uploaded: 'bg-green-500',
  system:            'bg-yellow-500',
  alert:             'bg-red-500',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data as Notification[]);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* handled */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch { /* handled */ }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((p) => p.filter((n) => n.id !== id));
    } catch { /* handled */ }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Bell className="w-7 h-7 text-navy-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-navy-600 text-white text-xs font-bold">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">{notifications.length} total · {unreadCount} unread</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary btn-sm">
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <Bell className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
          <p className="text-slate-500 text-sm">No notifications at the moment.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden divide-y divide-base-border/50">
          {notifications.map((n) => (
            <div key={n.id}
              className={`flex items-start gap-3 px-5 py-4 hover:bg-base-elevated transition-colors ${!n.is_read ? 'bg-navy-500/5' : ''}`}>
              {/* Type dot */}
              <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${TYPE_COLORS[n.type] || 'bg-slate-600'}`} />

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                {n.message && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>}
                <p className="text-xs text-slate-700 mt-1">
                  {(() => { try { return formatDistanceToNow(new Date(n.created_at), { addSuffix: true }); } catch { return ''; } })()}
                </p>
              </div>

              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-navy-400 flex-shrink-0 mt-2" />
              )}

              <div className="flex gap-1 flex-shrink-0">
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} title="Mark as read"
                    className="btn-icon w-7 h-7 hover:text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id)} title="Delete"
                  className="btn-icon w-7 h-7 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
