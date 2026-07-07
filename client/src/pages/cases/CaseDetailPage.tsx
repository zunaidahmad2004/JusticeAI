import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, Trash2, FileText, Users, Archive,
  MapPin, Calendar, User, AlertCircle, Clock, Shield,
  CheckCircle2, File, Download, Fingerprint, Scale,
  Bot, ChevronRight, Hash, Building2, ShieldAlert,
} from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Case {
  id: string; case_number: string; fir_number?: string;
  title: string; description?: string; crime_type?: string;
  status: string; priority: string; date_of_incident: string;
  location?: string; io_name?: string; station?: string;
  created_at: string; updated_at: string;
  evidence_count?: number; witness_count?: number; suspect_count?: number;
}

const STATUS_CFG: Record<string, { label: string; badge: string; icon: React.ElementType; color: string }> = {
  open:                { label: 'Open',       badge: 'badge-blue',   icon: FileText,    color: '#3B82F6' },
  under_investigation: { label: 'Active',     badge: 'badge-yellow', icon: AlertCircle, color: '#F59E0B' },
  chargesheet_filed:   { label: 'Filed',      badge: 'badge-green',  icon: CheckCircle2,color: '#22C55E' },
  closed:              { label: 'Closed',     badge: 'badge-slate',  icon: CheckCircle2,color: '#64748B' },
};

const PRIORITY_CFG: Record<string, { badge: string; color: string }> = {
  critical: { badge: 'badge-red',    color: '#EF4444' },
  high:     { badge: 'badge-yellow', color: '#F59E0B' },
  medium:   { badge: 'badge-blue',   color: '#3B82F6' },
  low:      { badge: 'badge-slate',  color: '#64748B' },
};

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/cases/${id}`)
      .then((res) => setCaseData(res.data as Case))
      .catch(() => toast.error('Failed to load case'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this case? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/cases/${id}`);
      toast.success('Case deleted');
      navigate('/cases');
    } catch {
      toast.error('Failed to delete case');
      setDeleting(false);
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-10 w-72 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-36 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="glass-panel p-16 text-center">
        <AlertCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Case Not Found</h3>
        <Link to="/cases" className="btn-primary mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </Link>
      </div>
    );
  }

  const st  = STATUS_CFG[caseData.status]   || STATUS_CFG.open;
  const pri = PRIORITY_CFG[caseData.priority] || PRIORITY_CFG.low;
  const StatusIcon = st.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/cases" className="hover:text-navy-400 transition-colors">Cases</Link>
        <ChevronRight className="w-4 h-4 text-slate-700" />
        <span className="text-slate-300 font-mono">{caseData.case_number}</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Link to="/cases" className="btn-icon mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-navy-400">{caseData.case_number}</span>
              {caseData.fir_number && (
                <span className="text-xs text-slate-600">FIR: {caseData.fir_number}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight mb-3">{caseData.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={st.badge}>
                <StatusIcon className="w-3 h-3" />
                {st.label}
              </span>
              <span className={pri.badge}>
                {caseData.priority}
              </span>
              {caseData.crime_type && (
                <span className="badge-slate">{caseData.crime_type}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/ai-chat`} className="btn-secondary btn-sm">
            <Bot className="w-4 h-4" /> AI Analysis
          </Link>
          <Link to={`/cases/${id}`} className="btn-secondary btn-sm">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger btn-sm">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Priority accent bar */}
      <div
        className="h-1 rounded-full w-full"
        style={{ background: `linear-gradient(90deg, ${pri.color}60, transparent)` }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Main content ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Case Information */}
          <div className="glass-card">
            <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-base font-bold text-white">Case Information</h2>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { icon: Hash,      label: 'FIR Number',           value: caseData.fir_number || '—' },
                  { icon: FileText,  label: 'Crime Type',           value: caseData.crime_type || '—' },
                  { icon: Calendar,  label: 'Date of Incident',     value: format(new Date(caseData.date_of_incident), 'dd MMM yyyy') },
                  { icon: MapPin,    label: 'Location',             value: caseData.location || '—' },
                  { icon: Shield,    label: 'Investigating Officer',value: caseData.io_name || 'Not Assigned' },
                  { icon: Building2, label: 'Police Station',       value: caseData.station || '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-base-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
                      <row.icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="input-label mb-0.5">{row.label}</p>
                      <p className="text-sm text-slate-200">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {caseData.description && (
                <div className="mt-6 pt-6 border-t border-base-border">
                  <p className="input-label mb-2">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{caseData.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sub-module quick links */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { to: `/cases/${id}/evidence`,   icon: Archive,     color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Evidence',  count: caseData.evidence_count ?? 0 },
              { to: `/cases/${id}/witnesses`,  icon: Users,       color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Witnesses', count: caseData.witness_count  ?? 0 },
              { to: `/cases/${id}/suspects`,   icon: User,        color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Suspects',  count: caseData.suspect_count  ?? 0 },
            ].map((m) => (
              <Link
                key={m.label}
                to={m.to}
                className="glass-card-hover p-5 flex flex-col items-center text-center group"
              >
                <div className={`w-12 h-12 rounded-2xl ${m.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <m.icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{m.count}</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">{m.label}</p>
              </Link>
            ))}
          </div>

          {/* More tools */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { to: `/cases/${id}/timeline`,   icon: Clock,        color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Timeline'    },
              { to: `/cases/${id}/legal`,      icon: Scale,        color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Legal Provisions' },
              { to: `/cases/${id}/chargesheet`,icon: Fingerprint,  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: 'Chargesheet' },
            ].map((m) => (
              <Link
                key={m.label}
                to={m.to}
                className="glass-card-hover p-4 flex items-center gap-3 group"
              >
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center flex-shrink-0`}>
                  <m.icon className={`w-4.5 h-4.5 ${m.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{m.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-700 ml-auto group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Status card */}
          <div className="glass-card overflow-hidden">
            <div
              className="h-1"
              style={{ background: `linear-gradient(90deg, ${st.color}, transparent)` }}
            />
            <div className="p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Case Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Status',       value: <span className={st.badge}>{st.label}</span> },
                  { label: 'Priority',     value: <span className={pri.badge}>{caseData.priority}</span> },
                  { label: 'Created',      value: format(new Date(caseData.created_at), 'dd MMM yyyy') },
                  { label: 'Last Updated', value: format(new Date(caseData.updated_at), 'dd MMM yyyy') },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-base-border/50 last:border-0">
                    <span className="text-xs text-slate-600">{row.label}</span>
                    <span className="text-xs text-slate-300">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Actions</h3>
            <div className="space-y-2">
              {[
                { icon: File,        label: 'Generate Report',    action: () => toast.success('Generating...') },
                { icon: Download,    label: 'Export Case Data',   action: () => toast.success('Exporting...') },
                { icon: Bot,         label: 'AI Case Analysis',   action: () => navigate('/ai-chat') },
                { icon: Clock,       label: 'View Timeline',      action: () => navigate(`/cases/${id}/timeline`) },
                { icon: ShieldAlert, label: 'Risk Analysis',      action: () => navigate(`/risk-analysis?case_id=${id}`) },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="btn-secondary w-full justify-start text-sm"
                >
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
