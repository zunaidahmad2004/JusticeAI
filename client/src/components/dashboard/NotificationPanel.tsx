import { motion } from 'framer-motion';
import { Bell, ArrowUpRight, AlertTriangle, CheckCircle2, Calendar, FileWarning, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

interface Props {
  notifications: Notification[];
}

const TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  case_update:       { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  evidence_uploaded: { icon: CheckCircle2,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  system:            { icon: Calendar,      color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  alert:             { icon: FileWarning,   color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};

const FALLBACK_NOTIFS: Notification[] = [
  { id: 'f1', title: 'High Priority Case Assigned', message: 'Case JAI-2024-003 marked Critical', type: 'case_update', is_read: false, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'f2', title: 'FIR Analysis Complete', message: 'AI extracted 12 entities from FIR text', type: 'evidence_uploaded', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'f3', title: 'Court Hearing Tomorrow', message: 'Session Court at 10:30 AM', type: 'system', is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'f4', title: 'Evidence Verification Pending', message: '3 items awaiting verification', type: 'alert', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
];

export default function NotificationPanel({ notifications }: Props) {
  const display = notifications.length > 0 ? notifications : FALLBACK_NOTIFS;

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {display.filter((n) => !n.is_read).length} unread
            </p>
          </div>
        </div>
        <Link
          to="/notifications"
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-medium"
        >
          All <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area p-3 space-y-2">
        {display.map((n, i) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
                          hover:bg-[#1A2332] cursor-pointer
                          ${!n.is_read ? `${cfg.border} ${cfg.bg}` : 'border-transparent'}`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${n.is_read ? 'opacity-50' : ''}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold leading-snug ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-1 ring-2 ring-primary-500/20" />
                  )}
                </div>
                {n.message && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="text-[10px] text-slate-600">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
