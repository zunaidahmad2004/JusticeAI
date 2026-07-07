import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus, Search, Image, Video, Mic, FileText,
  Eye, CheckCircle2, ExternalLink, RefreshCw,
  Shield, Clock, MapPin, Tag, User, ArrowLeft,
  Filter, Link2,
} from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, type Variants } from 'framer-motion';

interface Evidence {
  id: string;
  evidence_number: string;
  title: string;
  description: string;
  evidence_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  collected_by_name?: string;
  collected_at?: string;
  location_found?: string;
  tags: string[];
  is_verified: boolean;
  ai_summary?: string;
  chain_of_custody: Array<{ timestamp: string; action: string; officer: string }>;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  image:    { icon: Image,    color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  video:    { icon: Video,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
  audio:    { icon: Mic,      color: 'text-green-400',  bg: 'bg-green-500/10'  },
  document: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  digital:  { icon: FileText, color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  forensic: { icon: Shield,   color: 'text-red-400',    bg: 'bg-red-500/10'    },
  physical: { icon: FileText, color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
};

function fmtSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function EvidencePage() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case_id') ?? undefined;

  const [evidence, setEvidence]       = useState<Evidence[]>([]);
  const [loading, setLoading]         = useState(true);
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [selected, setSelected]       = useState<Evidence | null>(null);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = caseId ? `/evidence?case_id=${caseId}` : '/evidence';
      const res = await api.get(url);
      setEvidence(res.data as Evidence[]);
    } catch {
      toast.error('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  const filtered = evidence.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || e.title.toLowerCase().includes(q)
      || e.evidence_number.toLowerCase().includes(q)
      || e.evidence_type.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || e.evidence_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleVerify = async (id: string) => {
    try {
      await api.put(`/evidence/${id}`, { is_verified: true });
      toast.success('Evidence verified');
      load();
    } catch {
      toast.error('Verification failed');
    }
  };

  const types = ['all', ...Array.from(new Set(evidence.map((e) => e.evidence_type)))];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {caseId && (
            <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-1">
              <ArrowLeft className="w-4 h-4" /> Back to Case
            </Link>
          )}
          <h1 className="page-title">Evidence</h1>
          <p className="page-subtitle">
            {evidence.length} item{evidence.length !== 1 ? 's' : ''} · {evidence.filter((e) => e.is_verified).length} verified
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setUploadOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Upload Evidence
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input pl-10 h-9"
              placeholder="Search by title, number, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-base-surface rounded-xl border border-base-border">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-navy-600 text-white shadow-glow-sm'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeInUp} className="glass-panel p-16 text-center">
          <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Evidence Found</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {search || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload the first piece of evidence to begin building the case record'}
          </p>
          {!search && typeFilter === 'all' && (
            <button onClick={() => setUploadOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Upload Evidence
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((e, i) => {
            const cfg = TYPE_CONFIG[e.evidence_type] || TYPE_CONFIG.document;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={e.id}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card-hover flex flex-col overflow-hidden"
              >
                {/* Top band */}
                <div className={`h-1 ${e.is_verified ? 'bg-green-500' : 'bg-base-border'}`} />

                <div className="p-5 flex flex-col flex-1 gap-3">
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{e.evidence_number}</span>
                        {e.is_verified && (
                          <span className="badge-green text-2xs">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{e.title}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  {e.description && (
                    <p className="text-xs text-slate-400 leading-relaxed truncate-2">{e.description}</p>
                  )}

                  {/* Meta */}
                  <div className="space-y-1.5">
                    {e.collected_at && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        {format(new Date(e.collected_at), 'dd MMM yyyy HH:mm')}
                      </div>
                    )}
                    {e.location_found && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{e.location_found}</span>
                      </div>
                    )}
                    {e.collected_by_name && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        {e.collected_by_name}
                      </div>
                    )}
                  </div>

                  {/* File chip */}
                  {e.file_url && (
                    <a
                      href={e.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-elevated
                                 border border-base-border hover:border-slate-600 transition-colors"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <Link2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="text-xs text-slate-400 truncate flex-1">{e.file_name}</span>
                      {e.file_size && <span className="text-2xs text-slate-600">{fmtSize(e.file_size)}</span>}
                      <ExternalLink className="w-3 h-3 text-navy-400 flex-shrink-0" />
                    </a>
                  )}

                  {/* Tags */}
                  {e.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-base-elevated text-2xs text-slate-500 border border-base-border">
                          <Tag className="w-2.5 h-2.5" />{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <button onClick={() => setSelected(e)} className="btn-secondary btn-sm flex-1">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    {!e.is_verified && (
                      <button onClick={() => handleVerify(e.id)} className="btn-primary btn-sm flex-1">
                        <CheckCircle2 className="w-4 h-4" /> Verify
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        caseId={caseId ?? ''}
        onSuccess={load}
      />

      {/* Detail Modal */}
      {selected && (
        <EvidenceDetailModal evidence={selected} onClose={() => setSelected(null)} />
      )}
    </motion.div>
  );
}

/* ─── Upload Modal ───────────────────────────────────────────────────────── */
function UploadModal({ isOpen, onClose, caseId, onSuccess }: {
  isOpen: boolean; onClose: () => void; caseId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '', evidence_type: 'document',
    description: '', location_found: '', collected_at: '',
  });
  const [file, setFile]         = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (caseId) fd.append('case_id', caseId);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      await api.post('/evidence', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Evidence uploaded');
      onSuccess();
      onClose();
      setForm({ title: '', evidence_type: 'document', description: '', location_found: '', collected_at: '' });
      setFile(null);
    } catch {
      toast.error('Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Evidence" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="input-label">Title *</label>
          <input className="input" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Brief description of the evidence" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Evidence Type</label>
            <select className="input" value={form.evidence_type}
              onChange={(e) => setForm({ ...form, evidence_type: e.target.value })}>
              {['image','video','audio','document','physical','digital','forensic'].map((t) => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Collected At</label>
            <input type="datetime-local" className="input" value={form.collected_at}
              onChange={(e) => setForm({ ...form, collected_at: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="input-label">Location Found</label>
          <input className="input" value={form.location_found}
            onChange={(e) => setForm({ ...form, location_found: e.target.value })}
            placeholder="Where was this evidence found?" />
        </div>
        <div>
          <label className="input-label">Description</label>
          <textarea className="input resize-none" rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="input-label">File Attachment</label>
          <input type="file" className="input text-slate-400"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-slate-600 mt-1">Images, videos, audio, PDFs. Max 50 MB.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
            ) : (
              <><Plus className="w-4 h-4" /> Upload</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
function EvidenceDetailModal({ evidence: e, onClose }: { evidence: Evidence; onClose: () => void }) {
  const cfg = TYPE_CONFIG[e.evidence_type] || TYPE_CONFIG.document;
  const Icon = cfg.icon;
  return (
    <Modal isOpen={true} onClose={onClose} title={e.title} size="xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-7 h-7 ${cfg.color}`} />
          </div>
          <div>
            <p className="font-mono text-sm text-slate-400">{e.evidence_number}</p>
            <h3 className="text-lg font-bold text-white">{e.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-slate capitalize">{e.evidence_type}</span>
              {e.is_verified && <span className="badge-green"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Collected By',  value: e.collected_by_name || '—' },
            { label: 'Collected At',  value: e.collected_at ? format(new Date(e.collected_at), 'dd MMM yyyy HH:mm') : '—' },
            { label: 'Location Found',value: e.location_found || '—' },
            { label: 'File Size',     value: fmtSize(e.file_size) || '—' },
          ].map((row) => (
            <div key={row.label} className="glass-card p-3">
              <p className="input-label mb-1">{row.label}</p>
              <p className="text-sm text-slate-200">{row.value}</p>
            </div>
          ))}
        </div>

        {e.description && (
          <div>
            <p className="input-label mb-2">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed">{e.description}</p>
          </div>
        )}

        {e.ai_summary && (
          <div className="glass-card p-4 border-l-4 border-navy-500">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">AI Summary</p>
            <p className="text-sm text-slate-300">{e.ai_summary}</p>
          </div>
        )}

        {e.chain_of_custody?.length > 0 && (
          <div>
            <p className="input-label mb-3">Chain of Custody</p>
            <div className="space-y-2">
              {e.chain_of_custody.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 glass-card p-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white font-medium">{entry.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {entry.officer} · {format(new Date(entry.timestamp), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
