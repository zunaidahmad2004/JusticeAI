import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderOpen, AlertTriangle, CheckCircle2, Archive, RefreshCw, Plus,
  Clock, ChevronRight, Bell, FileText, Upload, Bot, BarChart3,
  Calendar, Shield, ExternalLink, Scale, Microscope, ShieldAlert, Zap, Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import StatCard from '../components/dashboard/StatCard';
import CrimeHeatmap from '../components/dashboard/CrimeHeatmap';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  weekly_chart: Array<{ name: string; filings: number; resolved: number }>;
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
const stagger: Variants = { show: { transition: { staggerChildren: 0.05 } } };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow]           = useState(new Date());
  const welcomeRef = useRef<HTMLDivElement>(null);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Officer';

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closed     = data ? (data.cases_by_status.closed ?? 0) + (data.cases_by_status.chargesheet_filed ?? 0) : 0;
  const highPri    = data?.recent_cases.filter((c) => c.priority === 'high' || c.priority === 'critical').length ?? 0;
  const unreadNotifs = data?.recent_notifications.filter((n) => !n.is_read) ?? [];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!welcomeRef.current) return;
    const rect = welcomeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    welcomeRef.current.style.setProperty('--mouse-x', `${x}px`);
    welcomeRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-12">
      
      {/* ── 1. WELCOME BANNER ── */}
      <motion.div
        variants={fade}
        ref={welcomeRef}
        onMouseMove={handleMouseMove}
        className="glow-card-interactive glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-bold text-primary-400">
            <Zap className="w-3.5 h-3.5" /> Core Directive Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Online, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light max-w-xl leading-relaxed">
            Welcome back to the JusticeAI Command Console. You have <span className="text-primary-400 font-bold">{unreadNotifs.length} unread alerts</span> and <span className="text-yellow-400 font-bold">{data?.stats.unverified_evidence ?? 0} pending exhibits</span> requiring authentication.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-2xs text-slate-500 pt-2 font-mono">
            <span>STATION: CYBER DIVISION</span>
            <span>ROLE: {user?.role?.toUpperCase().replace('_', ' ')}</span>
            <span>TIME: {format(now, 'HH:mm')} IST</span>
          </div>
        </div>

        <div className="flex gap-3 z-10 flex-wrap justify-center">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Board
          </button>
          <button onClick={() => navigate('/cases/new')} className="btn-primary">
            <Plus className="w-4 h-4" />
            Launch Case
          </button>
        </div>
      </motion.div>

      {/* ── 2. METRICS STATS ── */}
      <motion.div variants={fade}>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Filings"    value={data?.stats.total_cases ?? 0}        icon={FolderOpen}   iconColor="text-blue-400"   iconBg="bg-blue-500/10"   accentColor="#3B82F6" delay={0}    onClick={() => navigate('/cases')} />
            <StatCard title="Active Inquest"   value={data?.stats.open_cases ?? 0}         icon={AlertTriangle}iconColor="text-yellow-400" iconBg="bg-yellow-500/10" accentColor="#F59E0B" delay={0.05} onClick={() => navigate('/cases?status=open')} />
            <StatCard title="Closed Cases"     value={closed}                              icon={CheckCircle2} iconColor="text-green-400"  iconBg="bg-green-500/10"  accentColor="#22C55E" delay={0.1}  onClick={() => navigate('/cases?status=closed')} />
            <StatCard title="High Alert"       value={highPri}                             icon={ShieldAlert}  iconColor="text-red-400"    iconBg="bg-red-500/10"    accentColor="#EF4444" delay={0.15} />
            <StatCard title="Exhibits Queue"   value={data?.stats.unverified_evidence ?? 0}icon={Archive}      iconColor="text-purple-400" iconBg="bg-purple-500/10"  accentColor="#8B5CF6" delay={0.2}  onClick={() => navigate('/evidence')} />
          </div>
        )}
      </motion.div>

      {/* ── 3. MAP + ANIMA CHARTS ── */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HEATMAP */}
        <div className="lg:col-span-7 flex flex-col" style={{ minHeight: 480 }}>
          <div className="glass-card flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-base-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Jurisdiction Heatmap</h3>
                <p className="text-xs text-slate-500">Real-time crime incident mapping</p>
              </div>
            </div>
            <div className="flex-1 min-h-[350px]">
              <CrimeHeatmap />
            </div>
          </div>
        </div>

        {/* ANALYTICS CHART */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="glass-card flex-1 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Ingestion Rate</h3>
                <p className="text-xs text-slate-500">Weekly filings compared to closures</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-bold">
                FORECAST
              </span>
            </div>
            <div className="flex-1 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.weekly_chart ?? []} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillFilings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#0F1419', borderColor: '#1E2533', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                  <Area type="monotone" dataKey="filings" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#fillFilings)" />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#fillResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4. RECENT CASES + ACTIONS ── */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Cases */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="glass-card flex-1 flex flex-col overflow-hidden max-h-[380px]">
            <div className="px-5 py-4 border-b border-base-border flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Cases</h3>
                <p className="text-xs text-slate-500">Latest active investigations</p>
              </div>
              <Link to="/cases" className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area p-2 space-y-1">
              {loading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-xl" />
                  ))}
                </div>
              ) : !data?.recent_cases?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">No active cases found</p>
                </div>
              ) : (
                data.recent_cases.slice(0, 5).map((c, i) => {
                  const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
                  const pri = PRIORITY_CONFIG[c.priority] || 'badge-slate';
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/cases/${c.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-base-elevated transition-all group border border-transparent hover:border-base-border/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-primary-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-mono text-primary-400">{c.case_number}</span>
                              <span className={`${pri} text-[9px] px-1 py-0`}>{c.priority}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                              {c.title}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary-400 transition-colors" />
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex-1 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white">Investigation Quick Actions</h3>
              <p className="text-xs text-slate-500">Immediate access to system tools</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Scale,       label: 'Register FIR',      sub: 'Smart AI filing',         path: '/case-filing',  color: 'text-primary-400',  bg: 'bg-primary-500/10' },
                { icon: FolderOpen,  label: 'Create Case',       sub: 'New inquest',             path: '/cases/new',    color: 'text-blue-400',     bg: 'bg-blue-500/10'    },
                { icon: Upload,      label: 'Upload Evidence',   sub: 'Add exhibits',            path: '/evidence',     color: 'text-purple-400',   bg: 'bg-purple-500/10'  },
                { icon: Microscope,  label: 'FIR Analyzer',      sub: 'OCR facts extraction',    path: '/fir-analyzer', color: 'text-cyan-400',     bg: 'bg-cyan-500/10'    },
                { icon: Bot,         label: 'AI Copilot',        sub: 'Query Indian law',        path: '/ai-chat',      color: 'text-green-400',    bg: 'bg-green-500/10'   },
                { icon: ShieldAlert,  label: 'Threat Matrix',     sub: 'Risk intelligence',       path: '/risk-analysis',color: 'text-red-400',      bg: 'bg-red-500/10'     },
              ].map((action) => (
                <motion.div
                  key={action.label}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    to={action.path}
                    className="glass-card-hover p-4 flex flex-col gap-3 group border border-base-border/50"
                  >
                    <div className={`w-9 h-9 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{action.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{action.sub}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
