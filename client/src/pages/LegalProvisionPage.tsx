import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import {
  Scale, Sparkles, ArrowLeft, Search, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  FileText, Shield, Clock, Info, Eye, Trash2,
  Download, Filter, BookOpen, Plus, X,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Provision {
  id: string;
  section: string;
  act_name: string;
  title: string;
  plain_language?: string;
  description?: string;
  punishment?: string;
  is_bailable?: boolean;
  is_cognizable?: boolean;
  typical_evidence?: string[];
  offense_category?: string;
  keywords?: string[];
}

interface CaseProvision {
  id: string;
  provision_id: string;
  section: string;
  act_name: string;
  title: string;
  plain_language?: string;
  punishment?: string;
  is_bailable?: boolean;
  is_cognizable?: boolean;
  typical_evidence?: string[];
  confidence_score: number;
  ai_reasoning?: string;
  why_applicable?: string;
  required_evidence: string[];
  investigation_notes?: string;
  status: 'suggested' | 'accepted' | 'rejected';
  review_notes?: string;
  analysis_run_id?: string;
  createdAt: string;
}

interface AnalysisResult {
  crime_category: string;
  analysis_summary: string;
  provisions: Array<{
    section: string;
    act_name: string;
    title: string;
    plain_language: string;
    why_applicable: string;
    confidence: number;
    required_evidence: string[];
    investigation_notes: string;
    is_cognizable: boolean;
    is_bailable: boolean;
    punishment: string;
  }>;
  missing_information: string[];
  recommended_further_sections: string[];
  disclaimer: string;
  analysis_run_id: string;
  provisions_saved: number;
}

const ACT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Bharatiya Nyaya Sanhita':        { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  'Bharatiya Nagarik Suraksha':     { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Bharatiya Sakshya':              { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20'   },
  'IT Act':                         { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
  'POCSO':                          { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/20'   },
  'NDPS':                           { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'Indian Penal Code':              { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
  'default':                        { bg: 'bg-navy-500/10',   text: 'text-navy-400',   border: 'border-navy-500/20'   },
};

function getActColor(actName: string) {
  const key = Object.keys(ACT_COLORS).find((k) => actName?.includes(k));
  return ACT_COLORS[key || 'default'];
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? 'from-green-600 to-green-400' : pct >= 50 ? 'from-yellow-600 to-yellow-400' : 'from-red-600 to-red-400';
  const textColor = pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-base-elevated rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  );
}

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.07 } } };

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LegalProvisionPage() {
  const { id: caseId } = useParams<{ id: string }>();

  const [savedProvisions, setSavedProvisions] = useState<CaseProvision[]>([]);
  const [loading, setLoading]       = useState(true);
  const [caseData, setCaseData]     = useState<any>(null);

  // AI analysis
  const [firText, setFirText]       = useState('');
  const [extraCtx, setExtraCtx]     = useState('');
  const [analyzing, setAnalyzing]   = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // DB search
  const [searchQ, setSearchQ]       = useState('');
  const [actFilter, setActFilter]   = useState('');
  const [searchResults, setSearchResults] = useState<Provision[]>([]);
  const [searching, setSearching]   = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  // UI
  const [tab, setTab]               = useState<'saved' | 'analyze' | 'search' | 'history'>('saved');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const [caseRes, provsRes] = await Promise.all([
        caseId ? api.get(`/cases/${caseId}`) : Promise.resolve({ data: null }),
        caseId ? api.get(`/legal/case-provisions/${caseId}`) : Promise.resolve({ data: [] }),
      ]);
      setCaseData(caseRes.data);
      setSavedProvisions(provsRes.data as CaseProvision[]);
    } catch { toast.error('Failed to load provisions'); }
    finally { setLoading(false); }
  }, [caseId]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  /* ── AI Analysis ─────────────────────────────────────────────────────── */
  const runAnalysis = async () => {
    if (!caseId && !firText.trim()) { toast.error('Provide FIR text or open a specific case'); return; }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await api.post('/legal/analyze', {
        case_id:            caseId || undefined,
        fir_text:           firText.trim() || undefined,
        additional_context: extraCtx.trim() || undefined,
        save_to_case:       !!caseId,
      }, { timeout: 120000 });
      setAnalysisResult(res.data as AnalysisResult);
      if (caseId) { loadSaved(); setTab('saved'); }
      toast.success(`Analysis complete — ${(res.data as AnalysisResult).provisions?.length ?? 0} provisions identified`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analysis failed. Check GEMINI_API_KEY.');
    } finally { setAnalyzing(false); }
  };

  /* ── DB Search ───────────────────────────────────────────────────────── */
  const runSearch = async () => {
    if (!searchQ.trim() && !actFilter) { toast.error('Enter a search term'); return; }
    setSearching(true);
    try {
      const params: Record<string, string> = { limit: '20' };
      if (searchQ)    params.search = searchQ;
      if (actFilter)  params.act    = actFilter;
      const res = await api.get('/legal/provisions', { params });
      setSearchResults((res.data as any).provisions || []);
      setSearchTotal((res.data as any).total || 0);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const addFromSearch = async (p: Provision) => {
    if (!caseId) { toast.error('Open a case to add provisions'); return; }
    try {
      await api.post('/legal/case-provisions', {
        case_id: caseId, provision_id: p.id, confidence_score: 0.6, status: 'suggested',
      });
      toast.success('Provision added to case');
      loadSaved();
    } catch { toast.error('Failed to add provision'); }
  };

  /* ── Update status ───────────────────────────────────────────────────── */
  const updateStatus = async (id: string, status: 'accepted' | 'rejected', reviewNotes?: string) => {
    try {
      await api.put(`/legal/case-provisions/${id}`, { status, review_notes: reviewNotes });
      toast.success(`Provision ${status}`);
      loadSaved();
    } catch { toast.error('Failed to update'); }
  };

  const removeProvision = async (id: string) => {
    if (!window.confirm('Remove this provision from the case?')) return;
    try {
      await api.delete(`/legal/case-provisions/${id}`);
      toast.success('Provision removed');
      loadSaved();
    } catch { toast.error('Failed to remove'); }
  };

  /* ── Export PDF (print) ──────────────────────────────────────────────── */
  const exportPDF = () => {
    const accepted = savedProvisions.filter((p) => p.status === 'accepted');
    if (!accepted.length) { toast.error('No accepted provisions to export'); return; }

    const content = `
      <html>
      <head>
        <title>Legal Provisions — ${caseData?.case_number || 'Case'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
          h1 { font-size: 20px; color: #1e3a5f; }
          h2 { font-size: 15px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          .meta { font-size: 12px; color: #555; margin-bottom: 4px; }
          .section { background: #f9f9f9; border-left: 4px solid #3b82f6; padding: 12px; margin: 12px 0; }
          .label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; margin-top: 8px; }
          .disclaimer { border: 1px solid #f59e0b; background: #fffbeb; padding: 12px; margin-top: 24px; font-size: 12px; }
          .evidence li { font-size: 12px; margin: 2px 0; }
        </style>
      </head>
      <body>
        <h1>Legal Provision Report</h1>
        <div class="meta">Case: ${caseData?.case_number || 'N/A'} — ${caseData?.title || ''}</div>
        <div class="meta">Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}</div>
        <div class="meta">Total accepted provisions: ${accepted.length}</div>
        ${accepted.map((p, i) => `
          <div class="section">
            <h2>${i + 1}. ${p.act_name} — Section ${p.section}</h2>
            <div class="meta">${p.title}</div>
            ${p.plain_language ? `<p>${p.plain_language}</p>` : ''}
            ${p.punishment ? `<div class="label">Punishment</div><p>${p.punishment}</p>` : ''}
            ${p.why_applicable ? `<div class="label">Why Applicable</div><p>${p.why_applicable}</p>` : ''}
            ${p.required_evidence?.length ? `<div class="label">Required Evidence</div><ul class="evidence">${p.required_evidence.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}
            ${p.investigation_notes ? `<div class="label">Investigation Notes</div><p>${p.investigation_notes}</p>` : ''}
            <div class="meta">Confidence: ${Math.round(p.confidence_score * 100)}% | Status: ${p.status}</div>
          </div>
        `).join('')}
        <div class="disclaimer">
          ⚠ DISCLAIMER: These legal provisions are AI-generated recommendations for investigative assistance only.
          All provisions must be verified and approved by a qualified advocate and authorized investigating officer
          before use in any official proceedings. This report does not constitute legal advice.
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(content); win.document.close(); win.print(); }
  };

  const filtered = savedProvisions.filter((p) => statusFilter === 'all' || p.status === statusFilter);
  const accepted  = savedProvisions.filter((p) => p.status === 'accepted').length;
  const suggested = savedProvisions.filter((p) => p.status === 'suggested').length;
  const rejected  = savedProvisions.filter((p) => p.status === 'rejected').length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fade} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {caseId && (
            <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-1">
              <ArrowLeft className="w-4 h-4" /> Back to Case
            </Link>
          )}
          <h1 className="page-title flex items-center gap-3">
            <Scale className="w-7 h-7 text-navy-400" />
            Legal Provision Recommendations
          </h1>
          {caseData && (
            <p className="page-subtitle">
              {caseData.case_number} — {caseData.title}
              {caseData.crime_type && ` · ${caseData.crime_type}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadSaved} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          {accepted > 0 && (
            <button onClick={exportPDF} className="btn-secondary">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          )}
          <button onClick={() => { setTab('analyze'); setAnalysisResult(null); }} className="btn-primary">
            <Sparkles className="w-4 h-4" /> AI Analysis
          </button>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div variants={fade} className="glass-card p-4 border-l-4 border-yellow-500/40 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-300/80 leading-relaxed">
          All legal provision recommendations are AI-generated for investigative assistance only.
          They do not declare guilt or constitute legal advice. All sections must be verified by a qualified
          advocate and approved by the investigating officer before use in official proceedings.
        </p>
      </motion.div>

      {/* Stats row */}
      {savedProvisions.length > 0 && (
        <motion.div variants={fade} className="grid grid-cols-3 gap-4">
          {[
            { label: 'Suggested', value: suggested, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Accepted',  value: accepted,  color: 'text-green-400',  bg: 'bg-green-500/10'  },
            { label: 'Rejected',  value: rejected,  color: 'text-red-400',    bg: 'bg-red-500/10'    },
          ].map((s) => (
            <div key={s.label} className={`glass-card p-4 text-center cursor-pointer hover:border-slate-600 transition-colors`}
              onClick={() => setStatusFilter(s.label.toLowerCase())}>
              <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={fade}>
        <div className="flex items-center gap-1 p-1 bg-base-surface rounded-xl border border-base-border w-fit">
          {(['saved', 'analyze', 'search'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all capitalize ${tab === t ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'}`}>
              {t === 'saved' ? `Saved (${savedProvisions.length})` : t === 'analyze' ? 'AI Analyze' : 'DB Search'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── SAVED TAB ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
      {tab === 'saved' && (
        <motion.div key="saved" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-4">
          {/* Status filter */}
          {savedProvisions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {(['all','suggested','accepted','rejected'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-navy-600 text-white' : 'text-slate-500 hover:text-white bg-base-elevated border border-base-border'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel p-14 text-center">
              <Scale className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Provisions Yet</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Use AI Analysis to automatically identify applicable legal sections, or search the legal database manually.
              </p>
              <button onClick={() => setTab('analyze')} className="btn-primary">
                <Sparkles className="w-4 h-4" /> Run AI Analysis
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((p) => {
                const actColor = getActColor(p.act_name);
                const isExpanded = expandedId === p.id;
                return (
                  <motion.div key={p.id} layout
                    className={`glass-card overflow-hidden border-l-4 ${p.status === 'accepted' ? 'border-green-500/60' : p.status === 'rejected' ? 'border-red-500/40 opacity-60' : 'border-navy-500/40'}`}>

                    {/* Main row */}
                    <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                      <div className="flex items-start gap-4">
                        <div className={`px-3 py-2 rounded-xl border flex-shrink-0 text-center ${actColor.bg} ${actColor.border}`}>
                          <p className={`text-lg font-bold tabular-nums ${actColor.text}`}>{p.section}</p>
                          <p className={`text-2xs font-semibold ${actColor.text} opacity-70`}>SEC</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-2xs font-bold px-2 py-0.5 rounded-lg border ${actColor.bg} ${actColor.text} ${actColor.border}`}>{p.act_name}</span>
                            {p.is_cognizable !== undefined && <span className={p.is_cognizable ? 'badge-red text-2xs' : 'badge-slate text-2xs'}>{p.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}</span>}
                            {p.is_bailable !== undefined && <span className={p.is_bailable ? 'badge-green text-2xs' : 'badge-yellow text-2xs'}>{p.is_bailable ? 'Bailable' : 'Non-Bailable'}</span>}
                            <span className={`text-2xs font-semibold ${p.status === 'accepted' ? 'text-green-400' : p.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'} capitalize`}>{p.status}</span>
                          </div>
                          <h3 className="text-base font-bold text-white leading-tight mb-1">{p.title}</h3>
                          {p.plain_language && <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{p.plain_language}</p>}
                          <div className="flex items-center gap-4 mt-2">
                            <ConfidenceBadge score={p.confidence_score} />
                            <span className="text-2xs text-slate-600">
                              {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {p.status === 'suggested' && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'accepted'); }}
                                className="w-8 h-8 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 flex items-center justify-center transition-colors" title="Accept">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'rejected'); }}
                                className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors" title="Reject">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); removeProvision(p.id); }}
                            className="w-8 h-8 rounded-xl hover:bg-base-elevated text-slate-600 hover:text-red-400 flex items-center justify-center transition-colors" title="Remove">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                          className="border-t border-base-border overflow-hidden">
                          <div className="p-5 space-y-4">
                            {p.punishment && (
                              <div>
                                <p className="input-label mb-1">Punishment</p>
                                <p className="text-sm text-slate-300">{p.punishment}</p>
                              </div>
                            )}
                            {p.why_applicable && (
                              <div className="glass-card p-4 border-l-4 border-navy-500/40">
                                <p className="input-label mb-2 text-navy-400">Why This Section May Apply</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{p.why_applicable}</p>
                              </div>
                            )}
                            {p.required_evidence?.length > 0 && (
                              <div>
                                <p className="input-label mb-2">Required Evidence</p>
                                <div className="flex flex-wrap gap-2">
                                  {p.required_evidence.map((e, i) => (
                                    <span key={i} className="text-xs px-3 py-1.5 rounded-xl bg-base-elevated border border-base-border text-slate-300 flex items-center gap-1.5">
                                      <Shield className="w-3 h-3 text-slate-500" />{e}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {p.investigation_notes && (
                              <div>
                                <p className="input-label mb-2">Investigation Notes</p>
                                <p className="text-sm text-slate-400 leading-relaxed">{p.investigation_notes}</p>
                              </div>
                            )}
                            {p.status === 'suggested' && (
                              <div className="flex gap-3 pt-2">
                                <button onClick={() => updateStatus(p.id, 'accepted')} className="btn-primary btn-sm flex-1">
                                  <CheckCircle2 className="w-4 h-4" /> Accept Provision
                                </button>
                                <button onClick={() => updateStatus(p.id, 'rejected')} className="btn-danger btn-sm flex-1">
                                  <XCircle className="w-4 h-4" /> Reject Provision
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── AI ANALYZE TAB ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
      {tab === 'analyze' && (
        <motion.div key="analyze" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-5">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-navy-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-navy-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Gemini AI Legal Analysis</h2>
                <p className="text-xs text-slate-500">Analyzes FIR text, case details, evidence, and witness statements to identify applicable legal provisions</p>
              </div>
            </div>

            {caseId && caseData && (
              <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300">
                  Case context loaded: {caseData.case_number} — {caseData.crime_type || 'Crime type not specified'}. Evidence, witnesses, and case details will be automatically included.
                </p>
              </div>
            )}

            <div>
              <label className="input-label">FIR Text / Complaint Text (Optional if case is loaded)</label>
              <textarea
                rows={6}
                className="input resize-y min-h-[120px]"
                value={firText}
                onChange={(e) => setFirText(e.target.value)}
                placeholder={caseId
                  ? "Optionally paste the full FIR text here to provide additional context beyond the case record..."
                  : "Paste the complete FIR text, complaint, or incident description here for AI analysis..."
                }
              />
              <p className="text-xs text-slate-600 mt-1">{firText.length} characters</p>
            </div>

            <div>
              <label className="input-label">Additional Investigation Context (Optional)</label>
              <textarea
                rows={3}
                className="input resize-none"
                value={extraCtx}
                onChange={(e) => setExtraCtx(e.target.value)}
                placeholder="Any other relevant details: suspect background, motive, digital evidence, specific circumstances..."
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <p className="text-xs text-slate-600 max-w-md">
                Gemini AI will analyze all provided context and recommend applicable sections from BNS, BNSS, BSA, IT Act, POCSO, NDPS, and other relevant Indian laws.
              </p>
              <button onClick={runAnalysis} disabled={analyzing || (!caseId && !firText.trim())} className="btn-primary">
                {analyzing
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing with Gemini...</>
                  : <><Sparkles className="w-4 h-4" /> Identify Legal Provisions</>
                }
              </button>
            </div>
          </div>

          {/* Analysis result */}
          {analysisResult && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-5">
              {/* Summary card */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Scale className="w-5 h-5 text-navy-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Analysis Summary</h3>
                    <p className="text-xs text-slate-500">{analysisResult.crime_category} · {analysisResult.provisions.length} provisions identified</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.analysis_summary}</p>
              </div>

              {/* Provisions */}
              <div className="space-y-4">
                {analysisResult.provisions.map((p, i) => {
                  const actColor = getActColor(p.act_name);
                  return (
                    <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.08 }}
                      className={`glass-card p-5 border-l-4 ${actColor.border}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`px-3 py-2 rounded-xl border flex-shrink-0 text-center ${actColor.bg} ${actColor.border}`}>
                          <p className={`text-lg font-bold ${actColor.text}`}>{p.section}</p>
                          <p className={`text-2xs ${actColor.text} opacity-70`}>SEC</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-2xs font-bold px-2 py-0.5 rounded-lg border ${actColor.bg} ${actColor.text} ${actColor.border}`}>{p.act_name}</span>
                            {p.is_cognizable !== undefined && <span className={p.is_cognizable ? 'badge-red text-2xs' : 'badge-slate text-2xs'}>{p.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}</span>}
                            {p.is_bailable !== undefined && <span className={p.is_bailable ? 'badge-green text-2xs' : 'badge-yellow text-2xs'}>{p.is_bailable ? 'Bailable' : 'Non-Bailable'}</span>}
                          </div>
                          <h3 className="text-base font-bold text-white mb-1">{p.title}</h3>
                          <ConfidenceBadge score={p.confidence} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        {p.plain_language && <p className="text-sm text-slate-300 leading-relaxed">{p.plain_language}</p>}
                        {p.why_applicable && (
                          <div className="bg-navy-500/5 border border-navy-500/20 rounded-xl px-4 py-3">
                            <p className="text-2xs font-bold text-navy-400 uppercase tracking-wider mb-1">Why This May Apply</p>
                            <p className="text-sm text-slate-300">{p.why_applicable}</p>
                          </div>
                        )}
                        {p.required_evidence?.length > 0 && (
                          <div>
                            <p className="text-2xs font-bold text-slate-600 uppercase tracking-wider mb-2">Required Evidence</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.required_evidence.map((e, j) => (
                                <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-base-elevated border border-base-border text-slate-400">{e}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {p.investigation_notes && (
                          <div>
                            <p className="text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Investigation Notes</p>
                            <p className="text-sm text-slate-400">{p.investigation_notes}</p>
                          </div>
                        )}
                        {p.punishment && (
                          <p className="text-xs text-slate-500">Punishment: {p.punishment}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Missing info */}
              {analysisResult.missing_information?.length > 0 && (
                <div className="glass-card p-5 border-l-4 border-yellow-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-bold text-yellow-400">Additional Information Needed</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {analysisResult.missing_information.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="glass-card p-4 border border-yellow-500/20 bg-yellow-500/5">
                <p className="text-xs text-yellow-300/80 leading-relaxed">{analysisResult.disclaimer}</p>
              </div>

              {/* Save to case CTA */}
              {caseId && analysisResult.provisions_saved > 0 && (
                <div className="flex items-center justify-between glass-card p-4">
                  <p className="text-sm text-slate-300">
                    <span className="text-green-400 font-semibold">{analysisResult.provisions_saved} provisions</span> automatically saved to case record.
                  </p>
                  <button onClick={() => setTab('saved')} className="btn-secondary btn-sm">
                    View Saved <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── DB SEARCH TAB ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
      {tab === 'search' && (
        <motion.div key="search" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-5">
          <div className="glass-card p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input className="input pl-10" placeholder="Search by section number, offence name, keyword, act..."
                  value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()} />
              </div>
              <select className="input w-auto" value={actFilter} onChange={(e) => setActFilter(e.target.value)}>
                <option value="">All Acts</option>
                <option value="Bharatiya Nyaya Sanhita">BNS 2023</option>
                <option value="Bharatiya Nagarik Suraksha">BNSS 2023</option>
                <option value="Bharatiya Sakshya">BSA 2023</option>
                <option value="IT Act">IT Act 2000</option>
                <option value="POCSO">POCSO 2012</option>
                <option value="NDPS">NDPS Act 1985</option>
                <option value="Indian Penal Code">IPC 1860</option>
                <option value="Corruption">Prevention of Corruption</option>
                <option value="Money Laundering">PMLA 2002</option>
              </select>
              <button onClick={runSearch} disabled={searching} className="btn-primary">
                {searching ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching...</> : <><Search className="w-4 h-4" />Search</>}
              </button>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <BookOpen className="w-14 h-14 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Search the Legal Database</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Search by section number (e.g. "103"), offence name (e.g. "theft"), keyword (e.g. "electronic evidence"), or act name.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">{searchTotal} result{searchTotal !== 1 ? 's' : ''} found</p>
              {searchResults.map((p) => {
                const actColor = getActColor(p.act_name);
                return (
                  <div key={p.id} className="glass-card p-4 flex items-start gap-4">
                    <div className={`px-2.5 py-1.5 rounded-xl border flex-shrink-0 text-center ${actColor.bg} ${actColor.border}`}>
                      <p className={`text-sm font-bold ${actColor.text}`}>{p.section}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-lg ${actColor.bg} ${actColor.text}`}>{p.act_name}</span>
                        {p.is_cognizable !== undefined && <span className={p.is_cognizable ? 'badge-red text-2xs' : 'badge-slate text-2xs'}>{p.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}</span>}
                        {p.is_bailable !== undefined && <span className={p.is_bailable ? 'badge-green text-2xs' : 'badge-yellow text-2xs'}>{p.is_bailable ? 'Bailable' : 'Non-Bailable'}</span>}
                      </div>
                      <h3 className="text-sm font-bold text-white">{p.title}</h3>
                      {p.plain_language && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{p.plain_language}</p>}
                      {p.punishment && <p className="text-xs text-slate-500 mt-0.5">{p.punishment}</p>}
                    </div>
                    {caseId && (
                      <button onClick={() => addFromSearch(p)} className="btn-secondary btn-sm flex-shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Add to Case
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

    </motion.div>
  );
}
