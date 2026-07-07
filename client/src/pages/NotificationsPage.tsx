import { useEffect, useState, useCallback } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/notifications');
    setNotifications(res.data as Notification[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BellIcon className="w-6 h-6 text-primary-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="badge bg-primary-600 text-white border-0 text-xs">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">{notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary btn-sm" onClick={markAllRead}>
            <CheckIcon className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <EmptyState icon={BellIcon} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="card divide-y divide-slate-800">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 ${!n.is_read ? 'bg-slate-800/20' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-primary-400' : 'bg-slate-700'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                {n.message && <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>}
                <p className="text-xs text-slate-600 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!n.is_read && (
                  <button
                    className="btn-ghost btn-sm p-1.5"
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => deleteNotification(n.id)}
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
