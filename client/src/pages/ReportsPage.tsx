import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  FileText, Download, RefreshCw, FolderOpen,
  Archive, Users, Sparkles, ChevronRight,
  Clock, CheckCircle2, AlertTriangle, Copy,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Case { id: string; case_number: string; title: string; crime_type?: string; }
interface ReportData {
  case?: Record<string, unknown>;
  evidence?: unknown[];
  witnesses?: unknown[];
  victims?: unknown[];
  suspects?: unknown[];
  documents?: unknown[];
  stats?: Record<string, number>;
  items?: unknown[];
  content?: string;
  generated_at?: string;
}

const REPORT_TYPES = [
  { id: 'case_report',        icon: FolderOpen, color: 'text-blue-400',   bg: 'bg-blue-500/10',
    label: 'Full Case Report',       desc: 'Complete case overview with all linked data',      ai: false, endpoint: 'case',               docType: '' },
  { id: 'evidence_inventory', icon: Archive,    color: 'text-purple-400', bg: 'bg-purple-500/10',
    label: 'Evidence Inventory',     desc: 'All evidence items with chain of custody',         ai: false, endpoint: 'evidence-inventory',  docType: '' },
  { id: 'witness_summary',    icon: Users,      color: 'text-green-400',  bg: 'bg-green-500/10',
    label: 'Witness Summary',        desc: 'All witness profiles and statement summaries',     ai: false, endpoint: 'witness-summary',     docType: '' },
  { id: 'chargesheet',        icon: FileText,   color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    label: 'Chargesheet Draft',      desc: 'AI-generated chargesheet draft for review',       ai: true,  endpoint: '',                    docType: 'chargesheet' },
  { id: 'case_diary',         icon: Clock,      color: 'text-cyan-400',   bg: 'bg-cyan-500/10',
    label: 'Case Diary Entry',       desc: "Today's investigation diary entry",                ai: true,  endpoint: '',                    docType: 'diary' },
  { id: 'case_summary',       icon: Sparkles,   color: 'text-navy-400',   bg: 'bg-navy-500/10',
    label: 'AI Case Summary',        desc: 'Gemini-generated investigation summary',           ai: true,  endpoint: '',                    docType: 'summary' },
];

const fade: Variants   = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

export default function ReportsPage() {
  const [cases, setCases]           = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [loading, setLoading]       = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [result, setResult]         = useState<ReportData | null>(null);
  const [activeReport, setActiveReport] = useState('');
  const [reportLabel, setReportLabel] = useState('');

  useEffect(() => {
    api.get('/cases', { params: { limit: 100 } })
      .then((r) => setCases((r.data?.cases ?? r.data) as Case[] || []))
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  }, []);

  const generate = async (rpt: typeof REPORT_TYPES[number]) => {
    if (!selectedCase) { toast.error('Select a case first'); return; }
    setLoading(true);
    setResult(null);
    setActiveReport(rpt.id);
    setReportLabel(rpt.label);
    try {
      let data: ReportData;
      if (rpt.ai) {
        const res = await api.post('/reports/ai-generate',
          { case_id: selectedCase, document_type: rpt.docType },
          { timeout: 120000 });
        data = res.data as ReportData;
      } else {
        const res = await api.get(`/reports/${rpt.endpoint}/${selectedCase}`);
        data = res.data as ReportData;
      }
      setResult(data);
      toast.success(`${rpt.label} generated`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${reportLabel.replace(/\s/g, '_')}_${selectedCase}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  const selectedCaseObj = cases.find((c) => c.id === selectedCase);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fade}>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate case reports, AI documents, and evidence inventories</p>
      </motion.div>

      {/* Case selector */}
      <motion.div variants={fade} className="glass-card p-5">
        <label className="input-label">Select Case</label>
        {loadingCases ? (
          <div className="skeleton h-11 rounded-xl" />
        ) : (
          <select className="input" value={selectedCase} onChange={(e) => { setSelectedCase(e.target.value); setResult(null); }}>
            <option value="">Choose a case to generate reports for...</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>
            ))}
          </select>
        )}
        {selectedCaseObj && (
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" />
            {selectedCaseObj.crime_type || 'Unknown crime type'}
          </p>
        )}
      </motion.div>

      {/* Report type cards */}
      <motion.div variants={fade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((rpt) => (
          <motion.button
            key={rpt.id}
            onClick={() => generate(rpt)}
            disabled={loading || !selectedCase}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.97 }}
            className={`glass-card-hover p-5 text-left flex flex-col gap-3 disabled:opacity-50 disabled:cursor-not-allowed
              ${activeReport === rpt.id && loading ? 'border-navy-500/40' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl ${rpt.bg} flex items-center justify-center`}>
                <rpt.icon className={`w-5 h-5 ${rpt.color}`} />
              </div>
              {activeReport === rpt.id && loading ? (
                <span className="w-5 h-5 border-2 border-navy-400/30 border-t-navy-400 rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-700" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-white">{rpt.label}</p>
                {rpt.ai && (
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-navy-500/10 text-navy-400 font-semibold">AI</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{rpt.desc}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              {reportLabel}
              {result.generated_at && (
                <span className="text-xs text-slate-500 font-normal">
                  · Generated {new Date(result.generated_at).toLocaleTimeString('en-IN')}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {result.content && (
                <button onClick={() => copyText(result.content!)} className="btn-secondary btn-sm">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              )}
              <button onClick={downloadJson} className="btn-secondary btn-sm">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          {/* AI text document */}
          {result.content ? (
            <div className="glass-card p-6">
              <div className="info-panel info-panel-warning mb-4">
                <p className="text-xs text-yellow-300">
                  ⚠ AI-generated document. Must be reviewed and approved by the Investigating Officer and
                  Public Prosecutor before official use.
                </p>
              </div>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto scroll-area">
                {result.content}
              </pre>
            </div>
          ) : (
            /* Structured data report */
            <div className="space-y-5">
              {/* Stats */}
              {result.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(result.stats).map(([key, val]) => (
                    <div key={key} className="glass-card p-4 text-center">
                      <p className="text-2xl font-bold text-white tabular-nums">{val}</p>
                      <p className="text-xs text-slate-500 mt-1 capitalize">{key.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence items */}
              {result.items && result.items.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-base-border">
                    <h3 className="text-sm font-bold text-white">Items ({result.items.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Title</th><th>Type</th><th>Status</th><th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.items as any[]).map((item, i) => (
                          <tr key={i}>
                            <td className="text-slate-500 text-xs">{i + 1}</td>
                            <td className="font-medium text-white">{item.title || item.full_name || '—'}</td>
                            <td><span className="badge-slate text-2xs capitalize">{item.evidence_type || item.witness_type || '—'}</span></td>
                            <td>{item.is_verified ? <span className="badge-green text-2xs">Verified</span> : <span className="badge-slate text-2xs">Pending</span>}</td>
                            <td className="text-slate-400 text-xs">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Witnesses */}
              {result.witnesses && (result.witnesses as any[]).length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-base-border">
                    <h3 className="text-sm font-bold text-white">Witnesses ({(result.witnesses as any[]).length})</h3>
                  </div>
                  <div className="divide-y divide-base-border/50">
                    {(result.witnesses as any[]).map((w, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-400 flex items-center justify-center text-white text-xs font-bold">
                          {(w.full_name || '?')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{w.full_name}</p>
                          <p className="text-xs text-slate-500">{w.statement_summary || 'No statement summary'}</p>
                        </div>
                        <span className={`ml-auto text-2xs ${w.court_appearance_status === 'appeared' ? 'badge-green' : 'badge-slate'}`}>
                          {w.court_appearance_status || 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Case info */}
              {result.case && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Case Information</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Case Number',   value: (result.case as any).case_number },
                      { label: 'Title',         value: (result.case as any).title       },
                      { label: 'Crime Type',    value: (result.case as any).crime_type  },
                      { label: 'Status',        value: (result.case as any).status      },
                      { label: 'Priority',      value: (result.case as any).priority    },
                      { label: 'IO Name',       value: (result.case as any).io_name     },
                    ].map((row) => row.value ? (
                      <div key={row.label}>
                        <p className="input-label mb-0.5">{row.label}</p>
                        <p className="text-sm text-slate-200 capitalize">{row.value}</p>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <motion.div variants={fade} className="glass-panel p-12 text-center">
          <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Report Generated</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Select a case above, then click any report type to generate it instantly.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
