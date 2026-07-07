import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, AlertCircle,
  RefreshCw, FolderOpen, ChevronRight, Target,
  Archive, FileText, Lightbulb, Clock, ArrowRight,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface RiskItem {
  category: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

interface MissingEvidenceItem {
  item: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  collection_method: string;
}

interface RiskReport {
  overall_score: number;
  status: 'strong' | 'adequate' | 'weak' | 'critical';
  risks: RiskItem[];
  missing_evidence: MissingEvidenceItem[];
  completed_steps: string[];
  pending_steps: string[];
  recommendations: string[];
  court_readiness: string;
  estimated_completion: string;
  case_id: string;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
  crime_type?: string;
  status: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const SEVERITY_STYLE: Record<string, string> = {
  high:   'badge-red',
  medium: 'badge-yellow',
  low:    'badge-slate',
};

const SEVERITY_ICON: Record<string, React.ElementType> = {
  high:   AlertTriangle,
  medium: AlertCircle,
  low:    AlertCircle,
};

const STATUS_CONFIG = {
  strong:   { label: 'Strong',   color: 'text-green-400',  bg: 'bg-green-500/10',  bar: 'from-green-600 to-green-400',  border: 'border-green-500/40' },
  adequate: { label: 'Adequate', color: 'text-blue-400',   bg: 'bg-blue-500/10',   bar: 'from-blue-600 to-blue-400',    border: 'border-blue-500/40'  },
  weak:     { label: 'Weak',     color: 'text-yellow-400', bg: 'bg-yellow-500/10', bar: 'from-yellow-600 to-yellow-400',border: 'border-yellow-500/40'},
  critical: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/10',    bar: 'from-red-600 to-red-400',      border: 'border-red-500/40'   },
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function RiskAnalysisPage() {
  const [searchParams] = useSearchParams();
  const initialCaseId  = searchParams.get('case_id') ?? '';

  const [cases, setCases]         = useState<Case[]>([]);
  const [selectedId, setSelectedId] = useState(initialCaseId);
  const [report, setReport]       = useState<RiskReport | null>(null);
  const [loading, setLoading]     = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);

  /* Load cases for selector */
  useEffect(() => {
    api.get('/cases', { params: { limit: 50 } })
      .then((res) => setCases((res.data?.cases ?? res.data ?? []) as Case[]))
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  }, []);

  /* Auto-analyze if case_id in URL */
  useEffect(() => {
    if (initialCaseId) analyze(initialCaseId);
  }, [initialCaseId]);

  const analyze = useCallback(async (caseId: string) => {
    if (!caseId) { toast.error('Select a case first'); return; }
    setLoading(true);
    setReport(null);
    try {
      const res = await api.post('/ai/risk-report', { case_id: caseId }, { timeout: 90000 });
      setReport(res.data as RiskReport);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Risk analysis failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedId);
  const statusCfg    = report ? STATUS_CONFIG[report.status] : null;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-5xl">

      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="page-title flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-400" />
          AI Investigation Risk Analysis
        </h1>
        <p className="page-subtitle">
          AI evaluates investigation completeness, identifies risks, and highlights missing evidence
        </p>
      </motion.div>

      {/* Case selector */}
      <motion.div variants={fadeIn} className="glass-card p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <label className="input-label">Select Case to Analyze</label>
            {loadingCases ? (
              <div className="skeleton h-11 rounded-xl" />
            ) : (
              <select
                className="input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Choose a case...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={() => analyze(selectedId)}
            disabled={loading || !selectedId}
            className="btn-primary"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <><ShieldAlert className="w-4 h-4" /> Run Risk Analysis</>
            )}
          </button>
          {report && (
            <button onClick={() => analyze(selectedId)} className="btn-secondary">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        {selectedCase && (
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" />
            {selectedCase.crime_type || 'Unknown crime type'} · Status: {selectedCase.status.replace(/_/g, ' ')}
          </p>
        )}
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      )}

      {/* Report */}
      {report && statusCfg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Score card */}
          <div className={`glass-card p-6 border-l-4 ${statusCfg.border}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-3xl ${statusCfg.bg} flex flex-col items-center justify-center`}>
                  <span className={`text-3xl font-bold tabular-nums ${statusCfg.color}`}>{report.overall_score}</span>
                  <span className="text-2xs text-slate-500 font-semibold">/100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">Investigation Score</h2>
                    <span className={`badge ${statusCfg.bg} ${statusCfg.color} border-0`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{report.estimated_completion}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Progress</p>
                <div className="w-48 h-3 bg-base-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${report.overall_score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${statusCfg.bar}`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-base-elevated/50 rounded-xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Court Readiness</p>
              <p className="text-sm text-slate-300 leading-relaxed">{report.court_readiness}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Risks Found',       value: report.risks.length,            color: 'text-red-400',   bg: 'bg-red-500/10'   },
              { label: 'Missing Evidence',  value: report.missing_evidence.length, color: 'text-yellow-400',bg: 'bg-yellow-500/10'},
              { label: 'Steps Completed',  value: report.completed_steps.length,  color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Pending Actions',  value: report.pending_steps.length,    color: 'text-slate-400', bg: 'bg-slate-500/10' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 text-center">
                <p className={`text-3xl font-bold tabular-nums ${s.color} mb-1`}>{s.value}</p>
                <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Risks */}
          {report.risks.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-base-border flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white">Identified Risks</h3>
                <span className="badge-red text-2xs ml-auto">{report.risks.length} issues</span>
              </div>
              <div className="divide-y divide-base-border/50">
                {report.risks.map((risk, i) => {
                  const Icon = SEVERITY_ICON[risk.severity];
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${risk.severity === 'high' ? 'text-red-400' : risk.severity === 'medium' ? 'text-yellow-400' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">{risk.category}</span>
                        <p className="text-sm text-slate-300">{risk.issue}</p>
                      </div>
                      <span className={SEVERITY_STYLE[risk.severity]}>{risk.severity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing Evidence */}
          {report.missing_evidence.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-base-border flex items-center gap-2">
                <Archive className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Missing Evidence</h3>
                <span className="badge-yellow text-2xs ml-auto">{report.missing_evidence.length} items</span>
              </div>
              <div className="divide-y divide-base-border/50">
                {report.missing_evidence.map((ev, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-bold text-white">{ev.item}</h4>
                      <span className={SEVERITY_STYLE[ev.priority]}>{ev.priority}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{ev.reason}</p>
                    <div className="flex items-start gap-2 px-3 py-2 bg-base-elevated rounded-xl">
                      <Target className="w-3.5 h-3.5 text-navy-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-400">{ev.collection_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed + Pending */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> Completed Steps
              </h3>
              {report.completed_steps.length === 0 ? (
                <p className="text-sm text-slate-600">No steps completed yet</p>
              ) : (
                <ul className="space-y-2">
                  {report.completed_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" /> Pending Steps
              </h3>
              {report.pending_steps.length === 0 ? (
                <p className="text-sm text-green-400">All steps completed!</p>
              ) : (
                <ul className="space-y-2">
                  {report.pending_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-navy-400" /> AI Recommendations
              </h3>
              <ul className="space-y-2.5">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-navy-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-2xs font-bold text-navy-400">
                      {i + 1}
                    </div>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-end gap-3">
            <Link to={`/cases/${report.case_id}`} className="btn-secondary">
              <FolderOpen className="w-4 h-4" /> View Case
            </Link>
            <Link to={`/ai-chat`} className="btn-primary">
              <FileText className="w-4 h-4" /> Ask AI Assistant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !report && (
        <motion.div variants={fadeIn} className="glass-panel p-16 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Analysis Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Select a case above and click "Run Risk Analysis" to get a comprehensive
            AI-powered investigation risk report.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
