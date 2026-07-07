import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
  Area, AreaChart,
} from 'recharts';
import api from '../lib/api';
import {
  TrendingUp, Layers, FileText, Users, Archive,
  BarChart3, RefreshCw, Activity,
} from 'lucide-react';

interface AnalyticsData {
  cases_by_month:  Array<{ month: string; count: string }>;
  cases_by_type:   Array<{ crime_type: string; count: string }>;
  evidence_by_type:Array<{ evidence_type: string; count: string }>;
  cases_by_status: Array<{ status: string; count: string }>;
  top_officers:    Array<{ full_name: string; case_count: string }>;
}

const PALETTE = ['#3B82F6','#F59E0B','#22C55E','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

const TOOLTIP_STYLE = {
  background: '#0F172A',
  border: '1px solid #1E293B',
  borderRadius: '12px',
  color: '#F1F5F9',
  fontSize: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', under_investigation: 'Active',
  chargesheet_filed: 'Filed', closed: 'Closed', archived: 'Archived',
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};
const stagger: Variants = { show: { transition: { staggerChildren: 0.08 } } };

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function ChartSkeleton() {
  return <div className="skeleton h-56 rounded-2xl" />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/analytics')
      .then((res) => setData(res.data as AnalyticsData))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const monthly  = data?.cases_by_month.map((d)  => ({ month: d.month.slice(0, 7), cases: +d.count }))  ?? [];
  const types    = data?.cases_by_type.map((d)   => ({ name: d.crime_type || 'Unknown', value: +d.count })) ?? [];
  const statuses = data?.cases_by_status.map((d) => ({ name: STATUS_LABELS[d.status] || d.status, value: +d.count })) ?? [];
  const evidence = data?.evidence_by_type.map((d)=> ({ name: d.evidence_type, value: +d.count })) ?? [];
  const officers = data?.top_officers.map((d)    => ({ name: d.full_name.split(' ')[0], cases: +d.case_count })) ?? [];

  const totalCases = statuses.reduce((s, d) => s + d.value, 0);
  const closedPct  = totalCases > 0
    ? Math.round(((statuses.find((s) => s.name === 'Closed')?.value ?? 0) / totalCases) * 100)
    : 0;
  const activeCases = statuses.find((s) => s.name === 'Active')?.value ?? 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Investigation statistics, trends and performance</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: FileText,  label: 'Total Cases',    value: totalCases,  color: 'text-blue-400',   bg: 'bg-blue-500/10',   accent: '#3B82F6' },
          { icon: Activity,  label: 'Active',         value: activeCases, color: 'text-yellow-400', bg: 'bg-yellow-500/10', accent: '#F59E0B' },
          { icon: TrendingUp,label: 'Closure Rate',   value: `${closedPct}%`, color: 'text-green-400',  bg: 'bg-green-500/10',  accent: '#22C55E' },
          { icon: Users,     label: 'Active Officers', value: officers.length, color: 'text-purple-400', bg: 'bg-purple-500/10', accent: '#8B5CF6' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 80% 0%, ${kpi.accent}08, transparent 65%)` }} />
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-[42px] font-bold text-white tabular-nums leading-none mb-2">
                {loading ? '—' : kpi.value}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Trend — full width area chart */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cases Over Time</h2>
              <p className="text-xs text-slate-500">Monthly registration trend</p>
            </div>
          </div>
          <div className="p-6">
            {loading ? <ChartSkeleton /> : monthly.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-600 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="cases" stroke="#3B82F6" strokeWidth={2}
                    fill="url(#areaGrad)" dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Case Status Donut */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">By Status</h2>
              <p className="text-xs text-slate-500">Case distribution</p>
            </div>
          </div>
          <div className="p-6">
            {loading ? <ChartSkeleton /> : statuses.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-600 text-sm">No data</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statuses} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                      paddingAngle={3} dataKey="value">
                      {statuses.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 mt-2">
                  {statuses.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-xs text-slate-400 flex-1">{item.name}</span>
                      <span className="text-xs font-bold text-slate-200 tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Crime Types */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">By Crime Type</h2>
              <p className="text-xs text-slate-500">Top reported offences</p>
            </div>
          </div>
          <div className="p-6">
            {loading ? <ChartSkeleton /> : types.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-600 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={types} layout="vertical" margin={{ left: 8 }}>
                  <defs>
                    <linearGradient id="barGradBlue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="url(#barGradBlue)" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Evidence Types */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Archive className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Evidence by Type</h2>
              <p className="text-xs text-slate-500">Collected items breakdown</p>
            </div>
          </div>
          <div className="p-6">
            {loading ? <ChartSkeleton /> : evidence.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-600 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={evidence}>
                  <defs>
                    <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#22C55E" />
                      <stop offset="100%" stopColor="#14B8A6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="url(#barGradGreen)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>

      {/* Officer Workload */}
      {!loading && officers.length > 0 && (
        <motion.div variants={fadeInUp} className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Officer Workload</h2>
              <p className="text-xs text-slate-500">Active case distribution per officer</p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={officers}>
                <defs>
                  <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="cases" fill="url(#barGradAmber)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
