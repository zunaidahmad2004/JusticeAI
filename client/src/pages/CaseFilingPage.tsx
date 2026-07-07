import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Scale, Sparkles, AlertTriangle, CheckCircle2,
  FileText, Shield, Clock, ChevronRight,
  BookOpen, Gavel, Info, ArrowRight, Plus,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface MatchedSection {
  _id: string;
  act_name: string;
  section: string;
  title: string;
  description: string;
  plain_language: string;
  offense_category: string;
  punishment: string;
  is_bailable: boolean;
  is_cognizable: boolean;
  typical_evidence: string[];
  why_applicable: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ProcedureStep {
  step: number;
  title: string;
  description: string;
  timeline: string;
  legal_reference: string;
}

interface CaseFilingAnalysis {
  matched_sections: MatchedSection[];
  investigation_procedure: ProcedureStep[];
  immediate_actions: string[];
  important_notes: string[];
  court_jurisdiction: string;
  arrest_powers: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const CONFIDENCE_STYLE: Record<string, string> = {
  high:   'badge-green',
  medium: 'badge-yellow',
  low:    'badge-slate',
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};
const stagger: Variants = { show: { transition: { staggerChildren: 0.07 } } };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CaseFilingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    crime_type: '',
    incident_description: '',
    incident_date: '',
    incident_location: '',
    victim_details: '',
    accused_details: '',
    additional_facts: '',
  });
  const [result, setResult]   = useState<CaseFilingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState<'sections' | 'procedure' | 'actions'>('sections');

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const analyze = async () => {
    if (!form.crime_type || !form.incident_description) {
      toast.error('Crime type and incident description are required');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/case-filing/analyze', form, { timeout: 120000 });
      setResult(res.data as CaseFilingAnalysis);
      toast.success('Analysis complete');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const createCase = () => {
    navigate('/cases/new');
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-5xl">

      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="page-title">Smart FIR Filing</h1>
        <p className="page-subtitle">
          Enter case details — AI matches applicable BNS/BNSS/BSA sections from the legal database
        </p>
      </motion.div>

      {/* Disclaimer */}
      <motion.div variants={fadeIn} className="glass-card p-4 border-l-4 border-blue-500/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 leading-relaxed">
          All legal section suggestions are advisory only and must be reviewed and confirmed by
          a qualified Investigating Officer and Public Prosecutor before official use in court proceedings.
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.div variants={fadeIn} className="glass-card p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-navy-400" />
          Incident Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Crime / Offence Type *</label>
            <input
              className="input"
              placeholder="e.g. Murder, Theft, Cyber Fraud, Kidnapping"
              value={form.crime_type}
              onChange={(e) => f('crime_type', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Date & Time of Incident</label>
            <input
              type="datetime-local"
              className="input"
              value={form.incident_date}
              onChange={(e) => f('incident_date', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Incident Description *</label>
          <textarea
            rows={5}
            className="input resize-none"
            placeholder="Describe what happened in detail — include sequence of events, how the offence was committed, weapons used, property stolen, injuries caused, etc."
            value={form.incident_description}
            onChange={(e) => f('incident_description', e.target.value)}
          />
        </div>

        <div>
          <label className="input-label">Location of Incident</label>
          <input
            className="input"
            placeholder="Full address / landmark / area"
            value={form.incident_location}
            onChange={(e) => f('incident_location', e.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Victim Details</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Name, age, address, injuries sustained..."
              value={form.victim_details}
              onChange={(e) => f('victim_details', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Accused / Suspect Details</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Name (if known), description, relationship to victim..."
              value={form.accused_details}
              onChange={(e) => f('accused_details', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Additional Facts</label>
          <textarea
            rows={2}
            className="input resize-none"
            placeholder="Any other relevant information — motive, prior incidents, digital evidence, etc."
            value={form.additional_facts}
            onChange={(e) => f('additional_facts', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <p className="text-xs text-slate-600">
            Fields marked * are required. More detail = more accurate section matching.
          </p>
          <button onClick={analyze} disabled={loading} className="btn-primary">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Match Legal Sections</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {/* Arrest Powers + Jurisdiction */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`glass-card p-4 border-l-4 ${result.arrest_powers.includes('CAN arrest') ? 'border-red-500/50' : 'border-yellow-500/50'}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Arrest Powers
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{result.arrest_powers}</p>
            </div>
            <div className="glass-card p-4 border-l-4 border-blue-500/30">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5" /> Court Jurisdiction
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{result.court_jurisdiction}</p>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 p-1 bg-base-surface rounded-xl border border-base-border w-fit">
            {(['sections', 'procedure', 'actions'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                  tab === t ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'
                }`}
              >
                {t === 'sections' ? 'Legal Sections' : t === 'procedure' ? 'Investigation Steps' : 'Immediate Actions'}
              </button>
            ))}
          </div>

          {/* Legal Sections tab */}
          {tab === 'sections' && (
            <div className="space-y-4">
              {result.matched_sections.length === 0 ? (
                <div className="glass-panel p-10 text-center">
                  <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No sections matched. Try adding more detail to the incident description.</p>
                </div>
              ) : result.matched_sections.map((sec, i) => (
                <motion.div
                  key={sec._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-white">
                          {sec.act_name} — Section {sec.section}
                        </span>
                        <span className={CONFIDENCE_STYLE[sec.confidence] || 'badge-slate'}>
                          {sec.confidence} confidence
                        </span>
                        {sec.is_cognizable !== undefined && (
                          <span className={sec.is_cognizable ? 'badge-red' : 'badge-slate'}>
                            {sec.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}
                          </span>
                        )}
                        {sec.is_bailable !== undefined && (
                          <span className={sec.is_bailable ? 'badge-green' : 'badge-yellow'}>
                            {sec.is_bailable ? 'Bailable' : 'Non-Bailable'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-navy-400">{sec.title}</p>
                    </div>
                  </div>

                  {sec.plain_language && (
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{sec.plain_language}</p>
                  )}

                  {sec.why_applicable && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 mb-3">
                      <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">Why applicable</p>
                      <p className="text-sm text-yellow-300/90">{sec.why_applicable}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    {sec.punishment && (
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-1">Punishment</p>
                        <p className="text-xs text-slate-400">{sec.punishment}</p>
                      </div>
                    )}
                    {sec.typical_evidence?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-1">Typical Evidence Required</p>
                        <div className="flex flex-wrap gap-1">
                          {sec.typical_evidence.slice(0, 4).map((e, j) => (
                            <span key={j} className="text-2xs px-2 py-0.5 rounded-lg bg-base-elevated border border-base-border text-slate-400">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Investigation Procedure tab */}
          {tab === 'procedure' && (
            <div className="relative pl-6 space-y-5 border-l-2 border-base-border">
              {result.investigation_procedure.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="relative"
                >
                  <div className="absolute -left-[29px] w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-white text-xs font-bold ring-4 ring-base-card">
                    {step.step}
                  </div>
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="text-sm font-bold text-white">{step.title}</h3>
                      <span className="flex items-center gap-1 text-2xs text-slate-500 flex-shrink-0">
                        <Clock className="w-3 h-3" />{step.timeline}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-2">{step.description}</p>
                    {step.legal_reference && (
                      <p className="text-xs text-navy-400 font-medium">{step.legal_reference}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Immediate Actions tab */}
          {tab === 'actions' && (
            <div className="space-y-4">
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  First 24 Hours — Immediate Actions
                </h3>
                <ul className="space-y-2.5">
                  {result.immediate_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-red-400">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-300">{action}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {result.important_notes?.length > 0 && (
                <div className="glass-card p-5 border-l-4 border-yellow-500/30">
                  <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Important Legal Notes
                  </h3>
                  <ul className="space-y-2">
                    {result.important_notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <ChevronRight className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="glass-card p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-white">Ready to create the case?</p>
              <p className="text-xs text-slate-500">Save these details and open a new investigation case.</p>
            </div>
            <button onClick={createCase} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Case
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
