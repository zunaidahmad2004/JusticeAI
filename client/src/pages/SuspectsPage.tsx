import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  AlertTriangle, Plus, ArrowLeft, Search, RefreshCw,
  User, Phone, MapPin, Hash, Edit, Trash2, Eye,
  Shield, FileText, Clock, Info, Fingerprint,
  Sparkles, ChevronRight, Archive, Car, Scale,
  CheckCircle2, XCircle, Building2, X,
} from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface CriminalRecord {
  id: string; case_number: string; offence: string;
  court: string; year: string; outcome: string;
  sentence?: string; notes?: string;
}
interface SuspectActivity {
  id: string; type: string; description: string;
  performed_by: string; createdAt: string;
}
interface Suspect {
  id: string; full_name: string; aliases: string[];
  age?: number; gender?: string; nationality?: string; occupation?: string;
  address?: string; phone?: string; email?: string;
  vehicle_numbers: string[]; national_id?: string; pan_number?: string;
  voter_id?: string; driving_license?: string;
  description?: string; photo_url?: string;
  arrest_status: string; arrest_date?: string;
  arresting_officer?: string; bail_status?: string;
  court_next_date?: string; criminal_history: CriminalRecord[];
  has_prior_record: boolean;
  linked_evidence: Array<{ _id: string; title: string; evidence_type: string }>;
  linked_cases: Array<{ _id: string; case_number: string; title: string }>;
  risk_level?: string; risk_summary?: string;
  risk_indicators: string[]; flight_risk?: boolean;
  notes?: string; known_associates: string[];
  activity_log: SuspectActivity[]; createdAt: string;
}
interface Case { id: string; case_number: string; title: string; }

const ARREST_CFG: Record<string, { label: string; badge: string; border: string }> = {
  not_arrested:     { label: 'Not Arrested',    badge: 'badge-yellow', border: 'border-yellow-500/40' },
  arrested:         { label: 'Arrested',         badge: 'badge-red',    border: 'border-red-500/50'    },
  released_on_bail: { label: 'Released on Bail', badge: 'badge-blue',   border: 'border-blue-500/40'   },
  absconding:       { label: 'Absconding',        badge: 'badge-red',    border: 'border-red-500/70'    },
  chargesheeted:    { label: 'Chargesheeted',     badge: 'badge-purple', border: 'border-purple-500/40' },
  acquitted:        { label: 'Acquitted',         badge: 'badge-green',  border: 'border-green-500/40'  },
};
const RISK_CFG: Record<string, { label: string; badge: string; color: string }> = {
  low:      { label: 'Low Risk',      badge: 'badge-green',  color: 'text-green-400'  },
  medium:   { label: 'Medium Risk',   badge: 'badge-yellow', color: 'text-yellow-400' },
  high:     { label: 'High Risk',     badge: 'badge-red',    color: 'text-red-400'    },
  critical: { label: 'Critical Risk', badge: 'badge-red',    color: 'text-red-500'    },
};
const ACT_ICONS: Record<string, React.ElementType> = {
  created: Plus, status_changed: Scale, evidence_linked: Archive,
  note_added: FileText, arrested: Fingerprint, released: CheckCircle2,
  ai_analysis: Sparkles, case_linked: ChevronRight,
};
const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

export default function SuspectsPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeCaseId = caseId || searchParams.get('case_id') || undefined;
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [cases, setCases]       = useState<Case[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter]     = useState('all');
  const [addOpen, setAddOpen]           = useState(false);
  const [editSuspect, setEditSuspect]   = useState<Suspect | null>(null);
  const [viewSuspect, setViewSuspect]   = useState<Suspect | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCaseId) params.case_id = activeCaseId;
      if (statusFilter !== 'all') params.arrest_status = statusFilter;
      if (riskFilter !== 'all')   params.risk_level    = riskFilter;
      if (search)                 params.q             = search;
      const res = await api.get('/suspects', { params });
      setSuspects(res.data as Suspect[]);
    } catch { toast.error('Failed to load suspects'); }
    finally { setLoading(false); }
  }, [activeCaseId, statusFilter, riskFilter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeCaseId) {
      api.get('/cases', { params: { limit: 100 } })
        .then((r) => setCases((r.data?.cases ?? r.data) as Case[] || []))
        .catch(() => {});
    }
  }, [activeCaseId]);

  const handleDelete = async (s: Suspect) => {
    if (!window.confirm(`Delete record for "${s.full_name}"? This cannot be undone.`)) return;
    try { await api.delete(`/suspects/${s.id}`); toast.success('Record deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fade} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {caseId && <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-1"><ArrowLeft className="w-4 h-4" /> Back to Case</Link>}
          <h1 className="page-title">Suspects / Persons of Interest</h1>
          <p className="page-subtitle">{suspects.length} records · {suspects.filter(s => s.arrest_status === 'arrested').length} in custody</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Record</button>
        </div>
      </motion.div>

      <motion.div variants={fade} className="glass-card p-4 border-l-4 border-yellow-500/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-300/80">
          These records are for investigative tracking only. Recording a person here does not imply guilt.
          All persons are presumed innocent until proven guilty in a court of law under Article 21 of the Constitution of India.
        </p>
      </motion.div>

      <motion.div variants={fade} className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input pl-10 h-9"
              placeholder="Search name, alias, phone, Aadhaar, vehicle number..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input h-9 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {Object.entries(ARREST_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="input h-9 w-auto" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">All Risk Levels</option>
            {Object.entries(RISK_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_,i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : suspects.length === 0 ? (
        <motion.div variants={fade} className="glass-panel p-16 text-center">
          <Fingerprint className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            {search || statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add persons of interest to begin tracking investigative details.'}
          </p>
          {!search && statusFilter === 'all' && riskFilter === 'all' && (
            <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add First Record</button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {suspects.map((s) => {
            const cfg  = ARREST_CFG[s.arrest_status] || ARREST_CFG.not_arrested;
            const risk = s.risk_level ? RISK_CFG[s.risk_level] : null;
            return (
              <motion.div key={s.id} variants={fade} whileHover={{ y:-4, transition:{ duration:0.2 } }}
                className={`glass-card flex flex-col overflow-hidden border-l-4 ${cfg.border}`}>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      {s.photo_url
                        ? <img src={s.photo_url} alt={s.full_name} className="w-full h-full rounded-xl object-cover" />
                        : <Fingerprint className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${cfg.badge} text-2xs`}>{cfg.label}</span>
                        {risk && <span className={`${risk.badge} text-2xs`}>{risk.label}</span>}
                        {s.flight_risk && <span className="badge-red text-2xs">Flight Risk</span>}
                        {s.has_prior_record && <span className="badge-yellow text-2xs">Prior Record</span>}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{s.full_name}</h3>
                      {s.aliases.length > 0 && <p className="text-2xs text-slate-500">aka {s.aliases.join(', ')}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {s.phone && <div className="flex items-center gap-2 text-xs text-slate-400"><Phone className="w-3.5 h-3.5" />{s.phone}</div>}
                    {s.address && <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{s.address}</span></div>}
                    {s.national_id && <div className="flex items-center gap-2 text-xs text-slate-400"><Hash className="w-3.5 h-3.5" />Aadhaar: {s.national_id}</div>}
                    {s.vehicle_numbers.length > 0 && <div className="flex items-center gap-2 text-xs text-slate-400"><Car className="w-3.5 h-3.5" />{s.vehicle_numbers.join(', ')}</div>}
                    {s.age && <div className="flex items-center gap-2 text-xs text-slate-400"><User className="w-3.5 h-3.5" />{s.age} yrs{s.gender ? ` · ${s.gender}` : ''}{s.occupation ? ` · ${s.occupation}` : ''}</div>}
                  </div>
                  {s.risk_summary && (
                    <p className="text-xs text-slate-500 italic border-t border-base-border pt-2 line-clamp-2">{s.risk_summary}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-base-border">
                    <div><p className="text-base font-bold text-white">{s.criminal_history.length}</p><p className="text-2xs text-slate-600">Prior Cases</p></div>
                    <div><p className="text-base font-bold text-white">{s.linked_evidence.length}</p><p className="text-2xs text-slate-600">Evidence</p></div>
                    <div><p className="text-base font-bold text-white">{s.activity_log.length}</p><p className="text-2xs text-slate-600">Activities</p></div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => setViewSuspect(s)} className="btn-secondary btn-sm flex-1"><Eye className="w-3.5 h-3.5" /> View</button>
                    <button onClick={() => setEditSuspect(s)} className="btn-icon w-8 h-8"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(s)} className="btn-icon w-8 h-8 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <SuspectFormModal isOpen={addOpen} onClose={() => setAddOpen(false)} caseId={activeCaseId} cases={cases} onSuccess={load} />
      {editSuspect && <SuspectFormModal isOpen={true} suspect={editSuspect} onClose={() => setEditSuspect(null)} caseId={activeCaseId} cases={cases} onSuccess={load} />}
      {viewSuspect && <SuspectDetailModal suspect={viewSuspect} onClose={() => setViewSuspect(null)} onRefresh={load} />}
    </motion.div>
  );
}

function SuspectFormModal({ isOpen, suspect, onClose, caseId, cases, onSuccess }: {
  isOpen: boolean; suspect?: Suspect | null; onClose: () => void;
  caseId?: string; cases: Case[]; onSuccess: () => void;
}) {
  const isEdit = !!suspect;
  const [form, setForm] = useState({
    case_id: caseId || '', full_name: suspect?.full_name || '',
    aliases: (suspect?.aliases||[]).join(', '),
    age: suspect?.age?.toString() || '', gender: suspect?.gender || '',
    nationality: suspect?.nationality || 'Indian', occupation: suspect?.occupation || '',
    phone: suspect?.phone || '', email: suspect?.email || '', address: suspect?.address || '',
    vehicle_numbers: (suspect?.vehicle_numbers||[]).join(', '),
    national_id: suspect?.national_id || '', pan_number: suspect?.pan_number || '',
    voter_id: suspect?.voter_id || '', driving_license: suspect?.driving_license || '',
    description: suspect?.description || '',
    arrest_status: suspect?.arrest_status || 'not_arrested',
    arrest_date: suspect?.arrest_date ? (() => { try { return format(new Date(suspect.arrest_date!), 'yyyy-MM-dd'); } catch { return ''; } })() : '',
    arresting_officer: suspect?.arresting_officer || '',
    bail_status: suspect?.bail_status || '',
    notes: suspect?.notes || '',
    known_associates: (suspect?.known_associates||[]).join(', '),
  });
  const [submitting, setSubmitting] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    if (!isEdit && !caseId && !form.case_id) { toast.error('Select a case'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        case_id: caseId || form.case_id,
        age: form.age ? parseInt(form.age) : undefined,
        aliases: form.aliases ? form.aliases.split(',').map(a=>a.trim()).filter(Boolean) : [],
        vehicle_numbers: form.vehicle_numbers ? form.vehicle_numbers.split(',').map(v=>v.trim()).filter(Boolean) : [],
        known_associates: form.known_associates ? form.known_associates.split(',').map(a=>a.trim()).filter(Boolean) : [],
      };
      if (isEdit) { await api.put(`/suspects/${suspect!.id}`, payload); toast.success('Record updated'); }
      else { await api.post('/suspects', payload); toast.success('Record added'); }
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit — ${suspect!.full_name}` : 'Add Suspect Record'} size="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
        <div className="info-panel info-panel-warning">
          <p className="text-xs text-yellow-300">This record is for investigative tracking only. It does not imply guilt of any criminal act.</p>
        </div>
        {!caseId && !isEdit && (
          <div><label className="input-label">Case *</label>
            <select className="input" value={form.case_id} onChange={(e) => f('case_id', e.target.value)}>
              <option value="">Select a case...</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}
            </select>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="input-label">Full Name *</label><input className="input" value={form.full_name} onChange={(e) => f('full_name', e.target.value)} placeholder="Full legal name" /></div>
          <div className="sm:col-span-2"><label className="input-label">Aliases (comma-separated)</label><input className="input" value={form.aliases} onChange={(e) => f('aliases', e.target.value)} placeholder="Nicknames, alternate names..." /></div>
          <div><label className="input-label">Age</label><input type="number" className="input" value={form.age} onChange={(e) => f('age', e.target.value)} min={1} max={120} /></div>
          <div><label className="input-label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
              <option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div><label className="input-label">Phone</label><input className="input" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
          <div><label className="input-label">Occupation</label><input className="input" value={form.occupation} onChange={(e) => f('occupation', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="input-label">Address</label><input className="input" value={form.address} onChange={(e) => f('address', e.target.value)} /></div>
          <div><label className="input-label">Aadhaar Number</label><input className="input" value={form.national_id} onChange={(e) => f('national_id', e.target.value)} /></div>
          <div><label className="input-label">PAN Number</label><input className="input" value={form.pan_number} onChange={(e) => f('pan_number', e.target.value)} /></div>
          <div><label className="input-label">Voter ID</label><input className="input" value={form.voter_id} onChange={(e) => f('voter_id', e.target.value)} /></div>
          <div><label className="input-label">Driving License</label><input className="input" value={form.driving_license} onChange={(e) => f('driving_license', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="input-label">Vehicle Numbers (comma-separated)</label><input className="input" value={form.vehicle_numbers} onChange={(e) => f('vehicle_numbers', e.target.value)} placeholder="MH01AB1234, DL5SAB1234" /></div>
          <div>
            <label className="input-label">Arrest Status</label>
            <select className="input" value={form.arrest_status} onChange={(e) => f('arrest_status', e.target.value)}>
              {Object.entries(ARREST_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {form.arrest_status === 'arrested' && <>
            <div><label className="input-label">Arrest Date</label><input type="date" className="input" value={form.arrest_date} onChange={(e) => f('arrest_date', e.target.value)} /></div>
            <div><label className="input-label">Arresting Officer</label><input className="input" value={form.arresting_officer} onChange={(e) => f('arresting_officer', e.target.value)} /></div>
          </>}
          {form.arrest_status === 'released_on_bail' && (
            <div className="sm:col-span-2"><label className="input-label">Bail Conditions / Amount</label><input className="input" value={form.bail_status} onChange={(e) => f('bail_status', e.target.value)} /></div>
          )}
          <div className="sm:col-span-2"><label className="input-label">Physical Description</label><textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => f('description', e.target.value)} placeholder="Height, build, skin tone, scars, tattoos, distinguishing marks..." /></div>
          <div className="sm:col-span-2"><label className="input-label">Known Associates (comma-separated)</label><input className="input" value={form.known_associates} onChange={(e) => f('known_associates', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="input-label">Investigation Notes (Officer Eyes Only)</label><textarea rows={2} className="input resize-none" value={form.notes} onChange={(e) => f('notes', e.target.value)} /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Updating...' : 'Adding...'}</> : isEdit ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SuspectDetailModal({ suspect: s, onClose, onRefresh }: {
  suspect: Suspect; onClose: () => void; onRefresh: () => void;
}) {
  const [tab, setTab] = useState<'profile'|'history'|'timeline'|'ai'>('profile');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult]   = useState<any>(null);
  const cfg  = ARREST_CFG[s.arrest_status] || ARREST_CFG.not_arrested;
  const risk = s.risk_level ? RISK_CFG[s.risk_level] : null;

  const runAiRisk = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/suspects/${s.id}/ai-risk`);
      setAiResult(res.data);
      toast.success('AI risk analysis complete');
      onRefresh();
    } catch { toast.error('AI analysis failed'); }
    finally { setAnalyzing(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={s.full_name} size="xl">
      <div className="flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-base-border flex items-center gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            {s.photo_url ? <img src={s.photo_url} className="w-full h-full rounded-2xl object-cover" /> : <Fingerprint className="w-6 h-6 text-red-400" />}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-1">
              <span className={`${cfg.badge} text-2xs`}>{cfg.label}</span>
              {risk && <span className={`${risk.badge} text-2xs`}>{risk.label}</span>}
              {s.flight_risk && <span className="badge-red text-2xs">Flight Risk</span>}
              {s.has_prior_record && <span className="badge-yellow text-2xs">Prior Criminal Record</span>}
            </div>
            {s.aliases.length > 0 && <p className="text-xs text-slate-500">aka {s.aliases.join(', ')}</p>}
          </div>
        </div>

        <div className="flex gap-1 px-6 py-2 border-b border-base-border bg-base-surface/30">
          {(['profile','history','timeline','ai'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${tab===t ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'}`}>
              {t === 'ai' ? 'AI Risk' : t === 'history' ? 'Criminal History' : t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-area p-6">
          {tab === 'profile' && (
            <div className="space-y-4">
              <div className="info-panel info-panel-warning">
                <p className="text-xs text-yellow-300">Investigative record only — presumed innocent until proven guilty.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label:'Age / Gender',     value:[s.age&&`${s.age} yrs`,s.gender].filter(Boolean).join(' · ') },
                  { label:'Nationality',       value:s.nationality },
                  { label:'Occupation',        value:s.occupation },
                  { label:'Phone',             value:s.phone },
                  { label:'Aadhaar',           value:s.national_id },
                  { label:'PAN',               value:s.pan_number },
                  { label:'Voter ID',          value:s.voter_id },
                  { label:'Driving License',   value:s.driving_license },
                  { label:'Vehicle Numbers',   value:s.vehicle_numbers.join(', ') || undefined },
                  { label:'Known Associates',  value:s.known_associates.join(', ') || undefined },
                  { label:'Arresting Officer', value:s.arresting_officer },
                  { label:'Bail Conditions',   value:s.bail_status },
                  { label:'Court Date', value:s.court_next_date ? (() => { try { return format(new Date(s.court_next_date),'dd MMM yyyy'); } catch { return '—'; } })() : undefined },
                  { label:'Address',           value:s.address },
                ].map(r => r.value ? (
                  <div key={r.label} className="glass-card p-3">
                    <p className="input-label mb-0.5">{r.label}</p>
                    <p className="text-sm text-slate-200">{r.value}</p>
                  </div>
                ) : null)}
              </div>
              {s.description && <div className="glass-card p-3"><p className="input-label mb-1">Physical Description</p><p className="text-sm text-slate-300 leading-relaxed">{s.description}</p></div>}
              {s.notes && <div className="glass-card p-3 border-l-4 border-yellow-500/30"><p className="input-label mb-1">Investigation Notes (Officer Eyes Only)</p><p className="text-sm text-slate-300">{s.notes}</p></div>}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-4">
              {s.criminal_history.length === 0 ? (
                <div className="text-center py-10"><Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">No prior criminal records on file</p></div>
              ) : s.criminal_history.map((r,i) => (
                <div key={r.id || i} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div><p className="text-sm font-bold text-white">{r.offence}</p><p className="text-xs text-slate-500">{r.court} · {r.year}</p></div>
                    <span className={`text-xs font-semibold ${(RISK_CFG as any)[r.outcome]?.color || 'text-slate-400'}`}>{r.outcome}</span>
                  </div>
                  {r.case_number && <p className="text-xs text-navy-400 mb-1">Case: {r.case_number}</p>}
                  {r.sentence && <p className="text-xs text-slate-400">Sentence: {r.sentence}</p>}
                  {r.notes && <p className="text-xs text-slate-500 mt-1">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'timeline' && (
            <div>
              {s.activity_log.length === 0 ? (
                <div className="text-center py-10"><Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">No activity recorded</p></div>
              ) : (
                <div className="relative pl-6 space-y-4 border-l-2 border-base-border">
                  {[...s.activity_log].reverse().map((act,i) => {
                    const Icon = ACT_ICONS[act.type] || Clock;
                    return (
                      <div key={act.id||i} className="relative">
                        <div className="absolute -left-[25px] w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center ring-4 ring-base-card">
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="glass-card p-3">
                          <p className="text-sm text-white">{act.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {act.performed_by} · {act.createdAt ? formatDistanceToNow(new Date(act.createdAt),{addSuffix:true}) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-5">
              <div className="info-panel info-panel-info">
                <p className="text-xs text-slate-300">AI risk indicators are for investigative purposes only. This assessment does not imply guilt or conclude any criminal act. Generated by Google Gemini.</p>
              </div>
              <button onClick={runAiRisk} disabled={analyzing} className="btn-primary w-full">
                {analyzing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing with Gemini...</> : <><Sparkles className="w-4 h-4" />Run AI Risk Assessment</>}
              </button>
              {(s.risk_level || aiResult) && (
                <div className="space-y-4">
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className={`w-6 h-6 ${risk?.color || 'text-slate-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-white">Risk Level: {risk?.label || 'Not assessed'}</p>
                        {s.flight_risk && <p className="text-xs text-red-400">⚠ Flight risk identified</p>}
                      </div>
                    </div>
                    {s.risk_summary && <p className="text-sm text-slate-300 leading-relaxed">{s.risk_summary}</p>}
                  </div>
                  {s.risk_indicators.length > 0 && (
                    <div className="glass-card p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Risk Indicators</p>
                      <ul className="space-y-2">
                        {s.risk_indicators.map((ind,i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />{ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiResult?.recommended_actions?.length > 0 && (
                    <div className="glass-card p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recommended Actions</p>
                      <ul className="space-y-2">
                        {aiResult.recommended_actions.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!s.risk_level && !aiResult && (
                <div className="glass-panel p-10 text-center">
                  <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No AI assessment yet. Click the button above to run Gemini analysis.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
