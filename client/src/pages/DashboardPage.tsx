import { useEffect, useState, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderOpen, AlertTriangle, CheckCircle2, Archive, RefreshCw, Plus,
  Clock, ChevronRight, Bell, FileText, Upload, Search, Bot, BarChart3,
  Calendar, Shield, ExternalLink, Scale, Microscope, ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import StatCard from '../components/dashboard/StatCard';
import CrimeHeatmap from '../components/dashboard/CrimeHeatmap';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Stats {
  total_cases: number;
  open_cases: number;
  unverified_evidence: number;
}

interface RecentCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  crime_type?: string;
  updated_at: string;
  io_name?: string;
}

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface DashboardData {
  stats: Stats;
  cases_by_status: Record<string, number>;
  recent_cases: RecentCase[];
  recent_notifications: Notification[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  open:                { label: 'Open',   badge: 'badge-blue'   },
  under_investigation: { label: 'Active', badge: 'badge-yellow' },
  chargesheet_filed:   { label: 'Filed',  badge: 'badge-green'  },
  closed:              { label: 'Closed', badge: 'badge-slate'  },
};

const PRIORITY_CONFIG: Record<string, string> = {
  critical: 'badge-red',
  high:     'badge-yellow',
  medium:   'badge-blue',
  low:      'badge-slate',
};

const NOTIF_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  case_update:       { icon: FolderOpen,  color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  evidence_uploaded: { icon: Upload,      color: 'text-green-400',  bg: 'bg-green-500/10'  },
  system:            { icon: Bell,        color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  alert:             { icon: AlertTriangle,color:'text-red-400',    bg: 'bg-red-500/10'    },
};

const fade: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};
const stagger: Variants = { show: { transition: { staggerChildren: 0.07 } } };

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow]           = useState(new Date());

  const firstName = user?.full_name?.split(' ')[0] ?? 'Officer';

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setData(res.data as DashboardData);
    } catch { /* silently fail — user sees skeleton */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Derived stats */
  const closed     = data ? (data.cases_by_status.closed ?? 0) + (data.cases_by_status.chargesheet_filed ?? 0) : 0;
  const highPri    = data?.recent_cases.filter((c) => c.priority === 'high' || c.priority === 'critical').length ?? 0;
  const unreadNotifs = data?.recent_notifications.filter((n) => !n.is_read) ?? [];

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7">

      {/* ── 1. HEADER ─────────────────────────────────────────────────────── */}
      <motion.div variants={fade} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {greeting()}, {firstName}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {format(now, 'EEEE, d MMMM yyyy')}
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {format(now, 'HH:mm')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => navigate('/cases/new')} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>
      </motion.div>

      {/* ── 2. STATS ──────────────────────────────────────────────────────── */}
      <motion.div variants={fade}>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            <StatCard title="Total Cases"      value={data?.stats.total_cases ?? 0}        icon={FolderOpen}   iconColor="text-blue-400"   iconBg="bg-blue-500/10"   accentColor="#3B82F6" delay={0}    onClick={() => navigate('/cases')} />
            <StatCard title="Active Cases"     value={data?.stats.open_cases ?? 0}         icon={AlertTriangle}iconColor="text-yellow-400" iconBg="bg-yellow-500/10" accentColor="#F59E0B" delay={0.05} onClick={() => navigate('/cases?status=open')} />
            <StatCard title="Closed Cases"     value={closed}                              icon={CheckCircle2} iconColor="text-green-400"  iconBg="bg-green-500/10"  accentColor="#22C55E" delay={0.1}  onClick={() => navigate('/cases?status=closed')} />
            <StatCard title="High Priority"    value={highPri}                             icon={AlertTriangle}iconColor="text-red-400"    iconBg="bg-red-500/10"    accentColor="#EF4444" delay={0.15} />
            <StatCard title="Evidence Pending" value={data?.stats.unverified_evidence ?? 0}icon={Archive}      iconColor="text-purple-400" iconBg="bg-purple-500/10"  accentColor="#8B5CF6" delay={0.2}  onClick={() => navigate('/evidence')} />
          </div>
        )}
      </motion.div>

      {/* ── 3. CRIME MAP + RECENT CASES ───────────────────────────────────── */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Map — takes 3 cols */}
        <div className="lg:col-span-3" style={{ height: 520 }}>
          <CrimeHeatmap />
        </div>

        {/* Recent Cases — takes 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-1">
          <div className="glass-card flex flex-col h-full overflow-hidden">
            <div className="px-5 py-4 border-b border-base-border flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white">Recent Cases</h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest 5 active investigations</p>
              </div>
              <Link to="/cases" className="text-xs text-navy-400 hover:text-navy-300 font-medium flex items-center gap-1">
                All cases <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area p-2">
              {loading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : !data?.recent_cases?.length ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500">No cases yet</p>
                  <Link to="/cases/new" className="btn-primary btn-sm mt-4">
                    <Plus className="w-3.5 h-3.5" /> Create Case
                  </Link>
                </div>
              ) : (
                data.recent_cases.slice(0, 5).map((c, i) => {
                  const st  = STATUS_CONFIG[c.status]   || STATUS_CONFIG.open;
                  const pri = PRIORITY_CONFIG[c.priority] || 'badge-slate';
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        to={`/cases/${c.id}`}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-elevated transition-all group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-navy-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-navy-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-mono text-navy-400 flex-shrink-0">{c.case_number}</span>
                            <span className={`${pri} text-2xs`}>{c.priority}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">{c.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`${st.badge} text-2xs`}>{st.label}</span>
                            {c.crime_type && <span className="text-2xs text-slate-600">{c.crime_type}</span>}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-700 group-hover:text-navy-400 flex-shrink-0 transition-colors" />
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4. NOTIFICATIONS + QUICK ACTIONS ──────────────────────────────── */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Notifications — 2 cols */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-base-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Notifications</h2>
                {unreadNotifs.length > 0 && (
                  <p className="text-xs text-slate-500">{unreadNotifs.length} unread</p>
                )}
              </div>
            </div>
            <Link to="/notifications" className="text-xs text-navy-400 hover:text-navy-300 font-medium flex items-center gap-1">
              All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-base-border/50">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : !data?.recent_notifications?.length ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            ) : (
              data.recent_notifications.slice(0, 5).map((n, i) => {
                const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-base-elevated transition-colors ${!n.is_read ? 'bg-navy-500/5' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.message}</p>
                      )}
                      <p className="text-2xs text-slate-700 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-navy-400 flex-shrink-0 mt-1.5" />
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions — 3 cols */}
        <div className="lg:col-span-3">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-white">Quick Actions</h2>
            <p className="text-xs text-slate-500">Common investigation tasks</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Scale,       label: 'Register FIR',      sub: 'Smart AI filing',         path: '/case-filing',  color: 'text-navy-400',   bg: 'bg-navy-500/10'   },
              { icon: FolderOpen,  label: 'Create Case',       sub: 'New investigation',       path: '/cases/new',    color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
              { icon: Upload,      label: 'Upload Evidence',   sub: 'Add to case record',      path: '/evidence',     color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Microscope,  label: 'FIR Analyzer',      sub: 'Extract entities + OCR',  path: '/fir-analyzer', color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
              { icon: Bot,         label: 'AI Assistant',      sub: 'Ask anything',            path: '/ai-chat',      color: 'text-green-400',  bg: 'bg-green-500/10'  },
              { icon: ShieldAlert,  label: 'Risk Analysis',     sub: 'Investigation score',     path: '/risk-analysis',color: 'text-red-400',    bg: 'bg-red-500/10'    },
            ].map((action) => (
              <motion.div
                key={action.label}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={action.path}
                  className="glass-card-hover p-4 flex flex-col gap-3 group block"
                >
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{action.sub}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
