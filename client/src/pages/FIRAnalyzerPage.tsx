import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Sparkles, FileText, AlertTriangle, CheckCircle2,
  Upload, X, File, ChevronDown, ChevronUp,
  Users, MapPin, Calendar, Lightbulb, Clock,
  ShieldAlert, Search, Zap,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface FIRAnalysis {
  summary: string;
  people: string[];
  places: string[];
  dates: string[];
  timeline: Array<{ date: string; event: string }>;
  key_facts: string[];
  missing_information: string[];
  offense_categories: string[];
  confidence: number;
  extracted_text?: string;
  file_name?: string;
}

interface HealthData { ai: string; }

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

const ACCEPTED_TYPES = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];

export default function FIRAnalyzerPage() {
  const [mode, setMode]         = useState<'text' | 'file'>('text');
  const [text, setText]         = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<FIRAnalysis | null>(null);
  const [loading, setLoading]   = useState(false);
  const [aiMode, setAiMode]     = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef                 = useRef<HTMLInputElement>(null);
  const isMock = aiMode === 'mock-mode';

  useEffect(() => {
    api.get('/health').then((res) => setAiMode((res.data as HealthData).ai || '')).catch(() => {});
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && ACCEPTED_TYPES.includes(dropped.type)) {
      setFile(dropped);
      setMode('file');
    } else {
      toast.error('Unsupported file type');
    }
  };

  const analyze = async () => {
    if (mode === 'text' && !text.trim()) { toast.error('Paste FIR text to analyze'); return; }
    if (mode === 'file' && !file)        { toast.error('Select a file to analyze');   return; }

    setLoading(true);
    setAnalysis(null);
    try {
      let data: FIRAnalysis;

      if (mode === 'file' && file) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/ai/analyze-fir-file', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
        data = res.data as FIRAnalysis;
        toast.success(`File analyzed: ${file.name}`);
      } else {
        const res = await api.post('/ai/analyze-fir', { text });
        data = res.data as FIRAnalysis;
        toast.success('Analysis complete');
      }

      setAnalysis(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = Math.round((analysis?.confidence ?? 0) * 100);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-5xl">

      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="page-title">FIR & Document Analyzer</h1>
        <p className="page-subtitle">
          Paste FIR text or upload a PDF/image — Gemini AI extracts entities, timeline, and offense categories
        </p>
      </motion.div>

      {/* AI status */}
      {aiMode && (
        <motion.div variants={fadeIn}
          className={`flex items-start gap-3 rounded-2xl px-4 py-3 border text-sm ${
            isMock
              ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300'
              : 'bg-green-500/5 border-green-500/20 text-green-300'
          }`}>
          {isMock
            ? <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <div>
            {isMock ? (
              <>
                <p className="font-semibold">AI in Mock Mode</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Set <code className="bg-yellow-900/30 px-1 rounded">GEMINI_API_KEY</code> in <code className="bg-yellow-900/30 px-1 rounded">server/.env</code> for real analysis.
                  Get a free key at{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">
                    aistudio.google.com
                  </a>
                </p>
              </>
            ) : (
              <p className="font-semibold">Google Gemini Active — <span className="font-normal opacity-80">{aiMode}</span></p>
            )}
          </div>
        </motion.div>
      )}

      {/* Input mode selector */}
      <motion.div variants={fadeIn} className="glass-card p-6 space-y-5">

        <div className="flex items-center gap-1 p-1 bg-base-surface rounded-xl border border-base-border w-fit">
          {(['text', 'file'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                mode === m ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'
              }`}
            >
              {m === 'text' ? 'Paste Text' : 'Upload File'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'text' ? (
            <motion.div key="text" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <textarea
                className="input resize-y min-h-[220px] font-mono text-sm"
                placeholder={`Paste the actual FIR text, complaint, witness statement, or incident report here.\n\nThe text should contain:\n• Names of persons involved\n• Date, time and location of incident\n• Description of what happened\n• Details of injuries or property stolen\n• Names of witnesses if any`}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-xs text-slate-600 mt-2">{text.length} characters</p>
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-navy-500 bg-navy-500/10'
                    : 'border-base-border hover:border-slate-600 hover:bg-base-elevated'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-500/10 flex items-center justify-center">
                      <File className="w-5 h-5 text-navy-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="ml-2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-base-elevated"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-300 mb-1">Drop file here or click to browse</p>
                    <p className="text-xs text-slate-600">PDF, Images (JPG, PNG), Word documents, Text files — Max 20 MB</p>
                    <p className="text-xs text-navy-400 mt-2">Gemini Vision will OCR scanned documents automatically</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-600 max-w-md">
            AI analysis is for investigative assistance only. All extracted information must be
            independently verified by investigating officers before official use.
          </p>
          <button
            onClick={analyze}
            disabled={loading || (mode === 'text' ? !text.trim() : !file)}
            className="btn-primary"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Analyze with Gemini</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            {/* Confidence + meta */}
            <div className="glass-card p-5 flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-navy-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-navy-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">AI Confidence</p>
                  <p className="text-2xl font-bold text-white tabular-nums">{confidencePct}%</p>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="h-2 bg-base-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidencePct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      confidencePct >= 70 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                      confidencePct >= 40 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                      'bg-gradient-to-r from-red-600 to-red-400'
                    }`}
                  />
                </div>
              </div>
              {analysis.file_name && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <File className="w-4 h-4 text-slate-500" />
                  {analysis.file_name}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3 text-slate-500">AI Summary</h3>
              <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Entities grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EntityCard icon={Users}    title="People Mentioned"  items={analysis.people}  color="text-blue-400"   emptyText="None identified" />
              <EntityCard icon={MapPin}   title="Locations"         items={analysis.places}  color="text-green-400"  emptyText="None identified" />
              <EntityCard icon={Calendar} title="Dates & Times"     items={analysis.dates}   color="text-yellow-400" emptyText="None identified" />
            </div>

            {/* Key facts */}
            {analysis.key_facts?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" /> Key Facts
                </h3>
                <ul className="space-y-2">
                  {analysis.key_facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-navy-400 font-bold mt-0.5 flex-shrink-0">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline */}
            {analysis.timeline?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" /> Extracted Timeline
                </h3>
                <div className="relative pl-4 space-y-4 border-l border-base-border">
                  {analysis.timeline.map((item, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-navy-500 ring-4 ring-base-card" />
                      <p className="text-xs font-semibold text-navy-400 mb-0.5">{item.date}</p>
                      <p className="text-sm text-slate-300">{item.event}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offense categories */}
            {analysis.offense_categories?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Possible Offence Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.offense_categories.map((cat, i) => (
                    <span key={i} className="badge-red">{cat}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing information */}
            {analysis.missing_information?.length > 0 && (
              <div className="glass-card p-5 border-l-4 border-yellow-500/40">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Potentially Missing Information
                </h3>
                <ul className="space-y-2">
                  {analysis.missing_information.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-300/80">
                      <span className="text-yellow-400 mt-0.5 flex-shrink-0 font-bold">!</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extracted OCR text (collapsible) */}
            {analysis.extracted_text && (
              <CollapsibleSection title="Extracted Raw Text (OCR)" icon={Search}>
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto scroll-area">
                  {analysis.extracted_text}
                </pre>
              </CollapsibleSection>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EntityCard({ icon: Icon, title, items, color, emptyText }: {
  icon: React.ElementType; title: string; items: string[];
  color: string; emptyText: string;
}) {
  return (
    <div className="glass-card p-4">
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${color}`}>
        <Icon className="w-3.5 h-3.5" />{title}
      </h3>
      {items?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-base-elevated border border-base-border text-xs text-slate-300">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-slate-600 text-xs">{emptyText}</p>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-300 hover:text-white"
      >
        <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-slate-500" />{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
