import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, ArrowLeft, Search, Filter, RefreshCw,
  Shield, Eye, Mic, BookOpen, Edit, Trash2, ChevronRight,
  Clock, FileText, Sparkles, AlertTriangle, CheckCircle2,
  Phone, MapPin, Briefcase, User, X, Upload, Calendar,
  Scale,
} from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Statement {
  id: string;
  content: string;
  statement_date: string;
  recorded_by: string;
  location?: string;
  ai_summary?: string;
}

interface Interview {
  id: string;
  date: string;
  officer_name: string;
  location?: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  performed_by: string;
  createdAt: string;
}

interface Witness {
  id: string;
  full_name: string;
  alias?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  witness_type: string;
  relationship_to_case?: string;
  court_appearance_status: string;
  protection_required: boolean;
  protection_status?: string;
  statements: Statement[];
  interview_history: Interview[];
  activity_log: Activity[];
  statement_summary?: string;
  notes?: string;
  is_hostile: boolean;
  createdAt: string;
}

interface Case { id: string; case_number: string; title: string; }

/* ─── Constants ──────────────────────────────────────────────────────────── */
const WITNESS_TYPES = [
  { value: 'eyewitness', label: 'Eyewitness',  icon: Eye,       color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  { value: 'expert',     label: 'Expert',       icon: BookOpen,  color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'informant',  label: 'Informant',    icon: Mic,       color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'character',  label: 'Character',    icon: User,      color: 'text-green-400',  bg: 'bg-green-500/10'  },
  { value: 'hostile',    label: 'Hostile',      icon: AlertTriangle,color:'text-red-400',  bg: 'bg-red-500/10'    },
  { value: 'other',      label: 'Other',        icon: Users,     color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
];

const COURT_STATUS: Record<string, { label: string; badge: string }> = {
  pending:              { label: 'Pending',           badge: 'badge-slate'  },
  appeared:             { label: 'Appeared',          badge: 'badge-green'  },
  not_appeared:         { label: 'Not Appeared',      badge: 'badge-red'    },
  exempted:             { label: 'Exempted',          badge: 'badge-yellow' },
  yet_to_be_summoned:   { label: 'To Be Summoned',   badge: 'badge-blue'   },
};

const PROTECTION_STATUS: Record<string, { label: string; badge: string }> = {
  requested:   { label: 'Requested',    badge: 'badge-yellow' },
  granted:     { label: 'Granted',      badge: 'badge-green'  },
  denied:      { label: 'Denied',       badge: 'badge-red'    },
  not_required:{ label: 'Not Required', badge: 'badge-slate'  },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  statement_added:    FileText,
  interview_conducted:Calendar,
  status_changed:     Scale,
  document_uploaded:  Upload,
  ai_analysis:        Sparkles,
  protection_updated: Shield,
  created:            Plus,
};

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function WitnessesPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const [searchParams]  = useSearchParams();
  const standaloneCase  = searchParams.get('case_id') ?? caseId;

  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [cases, setCases]         = useState<Case[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 9;

  const [addOpen, setAddOpen]           = useState(false);
  const [editWitness, setEditWitness]   = useState<Witness | null>(null);
  const [detailWitness, setDetailWitness] = useState<Witness | null>(null);
  const [statementWitness, setStatementWitness] = useState<Witness | null>(null);
  const [compareOpen, setCompareOpen]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (standaloneCase) params.case_id = standaloneCase;
      const res = await api.get('/witnesses', { params });
      setWitnesses(res.data as Witness[]);
    } catch { toast.error('Failed to load witnesses'); }
    finally { setLoading(false); }
  }, [standaloneCase]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!standaloneCase) {
      api.get('/cases', { params: { limit: 100 } })
        .then((r) => setCases((r.data?.cases ?? r.data) as Case[] || []))
        .catch(() => {});
    }
  }, [standaloneCase]);

  const filtered = witnesses.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || w.full_name.toLowerCase().includes(q)
      || (w.alias || '').toLowerCase().includes(q)
      || (w.phone || '').includes(q)
      || (w.occupation || '').toLowerCase().includes(q);
    const matchType  = typeFilter === 'all' || w.witness_type === typeFilter;
    const matchCourt = courtFilter === 'all' || w.court_appearance_status === courtFilter;
    return matchSearch && matchType && matchCourt;
  });

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleDelete = async (w: Witness) => {
    if (!window.confirm(`Delete witness "${w.full_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/witnesses/${w.id}`);
      toast.success('Witness record deleted');
      load();
    } catch { toast.error('Failed to delete witness'); }
  };

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
          <h1 className="page-title">Witnesses</h1>
          <p className="page-subtitle">
            {witnesses.length} recorded · {witnesses.filter((w) => w.protection_required).length} under protection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          {witnesses.length >= 2 && (
            <button onClick={() => setCompareOpen(true)} className="btn-secondary">
              <Sparkles className="w-4 h-4" /> Compare Statements
            </button>
          )}
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Witness
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade} className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input pl-10 h-9" placeholder="Search by name, alias, phone, occupation..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input h-9 w-auto" value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">All Types</option>
            {WITNESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="input h-9 w-auto" value={courtFilter}
            onChange={(e) => { setCourtFilter(e.target.value); setPage(1); }}>
            <option value="all">All Court Status</option>
            {Object.entries(COURT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {(search || typeFilter !== 'all' || courtFilter !== 'all') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setCourtFilter('all'); setPage(1); }}
              className="text-xs text-navy-400 hover:text-navy-300">Clear filters</button>
          </div>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : paginated.length === 0 ? (
        <motion.div variants={fade} className="glass-panel p-16 text-center">
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {witnesses.length === 0 ? 'No Witnesses Recorded' : 'No Results Found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            {witnesses.length === 0
              ? 'Add witness information to begin recording statements and tracking court appearances.'
              : 'Try adjusting your search or filters.'}
          </p>
          {witnesses.length === 0 && (
            <button onClick={() => setAddOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add First Witness
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map((w, i) => {
            const typeCfg = WITNESS_TYPES.find((t) => t.value === w.witness_type) || WITNESS_TYPES[5];
            const TypeIcon = typeCfg.icon;
            const courtCfg = COURT_STATUS[w.court_appearance_status] || COURT_STATUS.pending;
            return (
              <motion.div key={w.id} variants={fade}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card flex flex-col overflow-hidden">
                <div className={`h-1 ${w.is_hostile ? 'bg-red-500' : w.protection_required ? 'bg-yellow-500' : 'bg-navy-600'}`} />
                <div className="p-5 flex flex-col flex-1 gap-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-lg ${typeCfg.bg} ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        {w.is_hostile && <span className="badge-red text-2xs">Hostile</span>}
                        {w.protection_required && <span className="badge-yellow text-2xs flex items-center gap-1"><Shield className="w-2.5 h-2.5" />Protected</span>}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{w.full_name}</h3>
                      {w.alias && <p className="text-2xs text-slate-500">aka {w.alias}</p>}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="space-y-1.5">
                    {w.phone && <div className="flex items-center gap-2 text-xs text-slate-400"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{w.phone}</div>}
                    {w.address && <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{w.address}</span></div>}
                    {w.occupation && <div className="flex items-center gap-2 text-xs text-slate-400"><Briefcase className="w-3.5 h-3.5 flex-shrink-0" />{w.occupation}</div>}
                    {w.age && w.gender && <div className="flex items-center gap-2 text-xs text-slate-400"><User className="w-3.5 h-3.5 flex-shrink-0" />{w.age} yrs · {w.gender}</div>}
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-base-border">
                    <div className="text-center"><p className="text-base font-bold text-white">{w.statements.length}</p><p className="text-2xs text-slate-600">Statements</p></div>
                    <div className="text-center"><p className="text-base font-bold text-white">{w.interview_history.length}</p><p className="text-2xs text-slate-600">Interviews</p></div>
                    <div className="text-center"><span className={`text-2xs font-semibold ${courtCfg.badge}`}>{courtCfg.label}</span></div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => setDetailWitness(w)} className="btn-secondary btn-sm flex-1">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => setStatementWitness(w)} className="btn-primary btn-sm flex-1">
                      <FileText className="w-3.5 h-3.5" /> Statement
                    </button>
                    <button onClick={() => setEditWitness(w)} className="btn-icon w-8 h-8"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(w)} className="btn-icon w-8 h-8 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">Next</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <WitnessFormModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        caseId={standaloneCase} cases={cases} onSuccess={load} />

      {editWitness && (
        <WitnessFormModal isOpen={true} witness={editWitness} onClose={() => setEditWitness(null)}
          caseId={standaloneCase} cases={cases} onSuccess={load} />
      )}

      {detailWitness && (
        <WitnessDetailModal witness={detailWitness} onClose={() => setDetailWitness(null)}
          onAddStatement={() => { setStatementWitness(detailWitness); setDetailWitness(null); }}
          onRefresh={load} />
      )}

      {statementWitness && (
        <AddStatementModal witness={statementWitness}
          onClose={() => setStatementWitness(null)} onSuccess={load} />
      )}

      {compareOpen && (
        <CompareStatementsModal witnesses={witnesses} onClose={() => setCompareOpen(false)} />
      )}
    </motion.div>
  );
}

/* ─── Witness Add/Edit Form Modal ────────────────────────────────────────── */
function WitnessFormModal({ isOpen, witness, onClose, caseId, cases, onSuccess }: {
  isOpen: boolean; witness?: Witness | null;
  onClose: () => void; caseId?: string | null;
  cases: Case[]; onSuccess: () => void;
}) {
  const isEdit = !!witness;
  const [form, setForm] = useState({
    case_id: caseId || witness?.id || '',
    full_name: witness?.full_name || '',
    alias: witness?.alias || '',
    age: witness?.age?.toString() || '',
    gender: witness?.gender || '',
    phone: witness?.phone || '',
    email: witness?.email || '',
    address: witness?.address || '',
    occupation: witness?.occupation || '',
    witness_type: witness?.witness_type || 'eyewitness',
    relationship_to_case: witness?.relationship_to_case || '',
    court_appearance_status: witness?.court_appearance_status || 'pending',
    protection_required: witness?.protection_required || false,
    protection_status: witness?.protection_status || 'not_required',
    is_hostile: witness?.is_hostile || false,
    notes: witness?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!isEdit && !caseId && !form.case_id) e.case_id = 'Case is required';
    if (form.age && (isNaN(+form.age) || +form.age < 1 || +form.age > 120)) e.age = 'Enter valid age (1-120)';
    if (form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone)) e.phone = 'Enter valid phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const f = (k: string, v: string | boolean) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age) : undefined,
        case_id: caseId || form.case_id };
      if (isEdit) {
        await api.put(`/witnesses/${witness!.id}`, payload);
        toast.success('Witness updated');
      } else {
        await api.post('/witnesses', payload);
        toast.success('Witness added');
      }
      onSuccess(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save witness');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit — ${witness!.full_name}` : 'Add Witness'} size="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Case selector (standalone mode) */}
        {!caseId && !isEdit && (
          <div>
            <label className="input-label">Case *</label>
            <select className={`input ${errors.case_id ? 'input-error' : ''}`} value={form.case_id} onChange={(e) => f('case_id', e.target.value)}>
              <option value="">Select a case...</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}
            </select>
            {errors.case_id && <p className="text-xs text-red-400 mt-1">{errors.case_id}</p>}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="input-label">Full Name *</label>
            <input className={`input ${errors.full_name ? 'input-error' : ''}`} value={form.full_name}
              onChange={(e) => f('full_name', e.target.value)} placeholder="Full legal name" />
            {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <label className="input-label">Alias / Nickname</label>
            <input className="input" value={form.alias} onChange={(e) => f('alias', e.target.value)} placeholder="Also known as..." />
          </div>
          <div>
            <label className="input-label">Witness Type</label>
            <select className="input" value={form.witness_type} onChange={(e) => f('witness_type', e.target.value)}>
              {WITNESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Age</label>
            <input type="number" className={`input ${errors.age ? 'input-error' : ''}`} value={form.age}
              onChange={(e) => f('age', e.target.value)} placeholder="Years" min={1} max={120} />
            {errors.age && <p className="text-xs text-red-400 mt-1">{errors.age}</p>}
          </div>
          <div>
            <label className="input-label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
              <option value="">Select...</option>
              <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="input-label">Phone Number</label>
            <input className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone}
              onChange={(e) => f('phone', e.target.value)} placeholder="+91 98765 43210" />
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="input-label">Email Address</label>
            <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email}
              onChange={(e) => f('email', e.target.value)} placeholder="witness@email.com" />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">Full Address</label>
            <input className="input" value={form.address} onChange={(e) => f('address', e.target.value)}
              placeholder="House No., Street, City, State, PIN" />
          </div>
          <div>
            <label className="input-label">Occupation</label>
            <input className="input" value={form.occupation} onChange={(e) => f('occupation', e.target.value)} placeholder="e.g. Teacher, Shopkeeper" />
          </div>
          <div>
            <label className="input-label">Relationship to Case</label>
            <input className="input" value={form.relationship_to_case} onChange={(e) => f('relationship_to_case', e.target.value)}
              placeholder="e.g. Neighbour, Passerby, Doctor" />
          </div>
          <div>
            <label className="input-label">Court Appearance Status</label>
            <select className="input" value={form.court_appearance_status} onChange={(e) => f('court_appearance_status', e.target.value)}>
              {Object.entries(COURT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Protection Status</label>
            <select className="input" value={form.protection_status} onChange={(e) => f('protection_status', e.target.value)}>
              {Object.entries(PROTECTION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input type="checkbox" className="rounded" checked={form.protection_required}
              onChange={(e) => f('protection_required', e.target.checked)} />
            <Shield className="w-4 h-4 text-yellow-400" /> Protection Required
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input type="checkbox" className="rounded" checked={form.is_hostile}
              onChange={(e) => f('is_hostile', e.target.checked)} />
            <AlertTriangle className="w-4 h-4 text-red-400" /> Declared Hostile
          </label>
        </div>

        <div>
          <label className="input-label">Officer Notes</label>
          <textarea rows={2} className="input resize-none" value={form.notes}
            onChange={(e) => f('notes', e.target.value)}
            placeholder="Internal investigation notes about this witness (not for court records)" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Updating...' : 'Adding...'}</> : isEdit ? 'Update Witness' : 'Add Witness'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Add Statement Modal ────────────────────────────────────────────────── */
function AddStatementModal({ witness, onClose, onSuccess }: {
  witness: Witness; onClose: () => void; onSuccess: () => void;
}) {
  const [content, setContent]     = useState('');
  const [location, setLocation]   = useState('');
  const [date, setDate]           = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { toast.error('Statement content is required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/witnesses/${witness.id}/statements`, {
        content, location, statement_date: new Date(date).toISOString(),
      });
      toast.success('Statement recorded');
      onSuccess(); onClose();
    } catch { toast.error('Failed to save statement'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Record Statement — ${witness.full_name}`} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="info-panel info-panel-info">
          <p className="text-xs text-slate-300">
            Statements recorded under BNSS Section 180. Statements to police are NOT confessions.
            Confessions must be recorded before a Magistrate under BNSS Section 183.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Date & Time *</label>
            <input type="datetime-local" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Location of Recording</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Police Station, Hospital" />
          </div>
        </div>
        <div>
          <label className="input-label">Statement Content *</label>
          <textarea className="input resize-y min-h-[180px]" value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Record the witness statement verbatim. Include all details provided by the witness regarding the incident, persons involved, timeline, and observations..." />
          <p className="text-xs text-slate-600 mt-1">{content.length} characters</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting || !content.trim()} className="btn-primary flex-1">
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><FileText className="w-4 h-4" /> Save Statement</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Witness Detail Modal ───────────────────────────────────────────────── */
function WitnessDetailModal({ witness: w, onClose, onAddStatement, onRefresh }: {
  witness: Witness; onClose: () => void;
  onAddStatement: () => void; onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'profile'|'statements'|'timeline'|'ai'>('profile');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState(w.statement_summary || '');

  const runAiSummary = async () => {
    if (!w.statements.length) { toast.error('No statements to analyze'); return; }
    setAnalyzing(true);
    try {
      const res = await api.post('/ai/analyze-evidence', {
        evidence_id: null,
        title: `Witness Statements — ${w.full_name}`,
        evidence_type: 'witness_statement',
        description: w.statements.map((s, i) => `Statement ${i+1} (${s.statement_date ? format(new Date(s.statement_date),'dd MMM yyyy') : 'Unknown date'}): ${s.content}`).join('\n\n'),
      });
      const summary = (res.data as any).summary || 'Analysis complete.';
      setAiSummary(summary);
      await api.put(`/witnesses/${w.id}`, { statement_summary: summary });
      toast.success('AI analysis complete');
      onRefresh();
    } catch { toast.error('AI analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const typeCfg  = WITNESS_TYPES.find((t) => t.value === w.witness_type) || WITNESS_TYPES[5];
  const courtCfg = COURT_STATUS[w.court_appearance_status] || COURT_STATUS.pending;
  const protCfg  = w.protection_status ? PROTECTION_STATUS[w.protection_status] : null;

  return (
    <Modal isOpen={true} onClose={onClose} title={w.full_name} size="xl">
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Top info bar */}
        <div className="px-6 py-4 border-b border-base-border flex items-center gap-3 flex-wrap">
          <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center`}>
            <typeCfg.icon className={`w-5 h-5 ${typeCfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-2xs font-bold px-2 py-0.5 rounded-lg ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
              <span className={courtCfg.badge + ' text-2xs'}>{courtCfg.label}</span>
              {w.is_hostile && <span className="badge-red text-2xs">Hostile</span>}
              {w.protection_required && <span className="badge-yellow text-2xs flex items-center gap-1"><Shield className="w-2.5 h-2.5" />Protected</span>}
              {protCfg && <span className={protCfg.badge + ' text-2xs'}>{protCfg.label}</span>}
            </div>
            {w.alias && <p className="text-xs text-slate-500 mt-0.5">aka {w.alias}</p>}
          </div>
          <button onClick={onAddStatement} className="btn-primary btn-sm ml-auto">
            <Plus className="w-3.5 h-3.5" /> Add Statement
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-base-border bg-base-surface/30">
          {(['profile','statements','timeline','ai'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all capitalize ${activeTab === t ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'}`}>
              {t === 'ai' ? 'AI Analysis' : t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scroll-area p-6">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: User,      label: 'Age / Gender',     value: [w.age && `${w.age} yrs`, w.gender].filter(Boolean).join(' · ') },
                  { icon: Phone,     label: 'Phone',            value: w.phone },
                  { icon: MapPin,    label: 'Address',          value: w.address },
                  { icon: Briefcase, label: 'Occupation',       value: w.occupation },
                  { icon: ChevronRight,label:'Relationship',    value: w.relationship_to_case },
                  { icon: Clock,     label: 'Added',            value: format(new Date(w.createdAt), 'dd MMM yyyy') },
                ].map((row) => row.value ? (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-base-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
                      <row.icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div><p className="input-label mb-0.5">{row.label}</p><p className="text-sm text-slate-200">{row.value}</p></div>
                  </div>
                ) : null)}
              </div>
              {w.notes && (
                <div className="glass-card p-4">
                  <p className="input-label mb-2">Officer Notes</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{w.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* STATEMENTS */}
          {activeTab === 'statements' && (
            <div className="space-y-4">
              {w.statements.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No statements recorded yet</p>
                  <button onClick={onAddStatement} className="btn-primary btn-sm mt-3"><Plus className="w-3.5 h-3.5" /> Record First Statement</button>
                </div>
              ) : w.statements.map((s, i) => (
                <div key={s.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-navy-500/20 text-navy-400 text-xs font-bold flex items-center justify-center">{i+1}</span>
                      <span className="text-xs text-slate-400">
                        {s.statement_date ? format(new Date(s.statement_date), 'dd MMM yyyy HH:mm') : 'Date unknown'}
                        {s.recorded_by && ` · ${s.recorded_by}`}
                        {s.location && ` · ${s.location}`}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{s.content}</p>
                  {s.ai_summary && (
                    <div className="mt-3 p-3 bg-navy-500/5 border border-navy-500/20 rounded-xl">
                      <p className="text-2xs font-bold text-navy-400 uppercase mb-1">AI Summary</p>
                      <p className="text-xs text-slate-400">{s.ai_summary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-1">
              {w.activity_log.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No activity recorded yet</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 border-l-2 border-base-border">
                  {[...w.activity_log].reverse().map((act) => {
                    const Icon = ACTIVITY_ICONS[act.type] || Clock;
                    return (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[25px] w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center ring-4 ring-base-card">
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="glass-card p-3">
                          <p className="text-sm text-white">{act.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {act.performed_by} · {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AI ANALYSIS */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="info-panel info-panel-info">
                <p className="text-xs text-slate-300">
                  AI analysis is advisory only. All findings must be verified by the Investigating Officer.
                  Do not use AI summaries as primary evidence in court proceedings.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={runAiSummary} disabled={analyzing || w.statements.length === 0} className="btn-primary">
                  {analyzing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Run AI Analysis</>}
                </button>
                {w.statements.length === 0 && <p className="text-xs text-slate-500">Add statements first</p>}
              </div>
              {aiSummary ? (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-navy-400" />
                    <p className="text-sm font-bold text-white">AI Statement Analysis</p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                </div>
              ) : (
                <div className="glass-panel p-10 text-center">
                  <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No AI analysis yet. Click "Run AI Analysis" to generate a summary of all statements.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Compare Statements Modal ───────────────────────────────────────────── */
function CompareStatementsModal({ witnesses, onClose }: {
  witnesses: Witness[]; onClose: () => void;
}) {
  const withStatements = witnesses.filter((w) => w.statements.length > 0);
  const [sel1, setSel1]   = useState(withStatements[0]?.id || '');
  const [sel2, setSel2]   = useState(withStatements[1]?.id || '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!sel1 || !sel2 || sel1 === sel2) { toast.error('Select two different witnesses'); return; }
    const w1 = witnesses.find((w) => w.id === sel1)!;
    const w2 = witnesses.find((w) => w.id === sel2)!;
    setLoading(true);
    setResult('');
    try {
      const combined = [
        `WITNESS 1: ${w1.full_name} (${w1.witness_type})`,
        w1.statements.map((s, i) => `Statement ${i+1}: ${s.content}`).join('\n'),
        '',
        `WITNESS 2: ${w2.full_name} (${w2.witness_type})`,
        w2.statements.map((s, i) => `Statement ${i+1}: ${s.content}`).join('\n'),
      ].join('\n');

      const res = await api.post('/ai/analyze-evidence', {
        evidence_id: null,
        title: `Statement Comparison: ${w1.full_name} vs ${w2.full_name}`,
        evidence_type: 'witness_comparison',
        description: combined,
      }, { timeout: 90000 });

      const analysis = (res.data as any);
      const text = [
        analysis.summary || '',
        analysis.inconsistencies?.length ? '\n\n**Contradictions / Inconsistencies:**\n' + analysis.inconsistencies.map((i: string) => `• ${i}`).join('\n') : '',
        analysis.key_observations?.length ? '\n\n**Key Observations:**\n' + analysis.key_observations.map((o: string) => `• ${o}`).join('\n') : '',
        analysis.suggested_next_steps?.length ? '\n\n**Suggested Next Steps:**\n' + analysis.suggested_next_steps.map((s: string) => `• ${s}`).join('\n') : '',
      ].join('');

      setResult(text || 'Comparison complete. No major contradictions detected.');
      toast.success('Comparison complete');
    } catch { toast.error('Comparison failed'); }
    finally { setLoading(false); }
  };

  const w1obj = witnesses.find((w) => w.id === sel1);
  const w2obj = witnesses.find((w) => w.id === sel2);

  return (
    <Modal isOpen={true} onClose={onClose} title="AI Statement Comparison" size="xl">
      <div className="p-6 space-y-5">
        <div className="info-panel info-panel-info">
          <p className="text-xs text-slate-300">
            Gemini AI compares statements from two witnesses to identify contradictions, inconsistencies,
            and corroborating facts. Results are advisory only.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Witness 1</label>
            <select className="input" value={sel1} onChange={(e) => setSel1(e.target.value)}>
              <option value="">Select witness...</option>
              {withStatements.map((w) => <option key={w.id} value={w.id}>{w.full_name} ({w.statements.length} stmt)</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Witness 2</label>
            <select className="input" value={sel2} onChange={(e) => setSel2(e.target.value)}>
              <option value="">Select witness...</option>
              {withStatements.filter((w) => w.id !== sel1).map((w) => <option key={w.id} value={w.id}>{w.full_name} ({w.statements.length} stmt)</option>)}
            </select>
          </div>
        </div>

        {/* Preview */}
        {w1obj && w2obj && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[w1obj, w2obj].map((w, i) => (
              <div key={w.id} className="glass-card p-4">
                <p className="text-xs font-bold text-slate-400 mb-2">Witness {i+1}: {w.full_name}</p>
                {w.statements.slice(0, 1).map((s) => (
                  <p key={s.id} className="text-xs text-slate-500 line-clamp-4 leading-relaxed">{s.content}</p>
                ))}
                {w.statements.length > 1 && <p className="text-2xs text-slate-600 mt-1">+{w.statements.length - 1} more statement(s)</p>}
              </div>
            ))}
          </div>
        )}

        <button onClick={compare} disabled={loading || !sel1 || !sel2 || sel1 === sel2} className="btn-primary w-full">
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Comparing with Gemini AI...</> : <><Sparkles className="w-4 h-4" /> Compare Statements</>}
        </button>

        {result && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-navy-400" />
              <p className="text-sm font-bold text-white">AI Comparison Result</p>
            </div>
            <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{result}</pre>
          </div>
        )}

        {withStatements.length < 2 && (
          <div className="text-center py-6">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">At least two witnesses with statements are required for comparison.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
