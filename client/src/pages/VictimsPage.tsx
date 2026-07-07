import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Heart, Plus, ArrowLeft, Search, RefreshCw,
  User, Phone, MapPin, Edit, Trash2, Eye,
  AlertTriangle, Shield, FileText, Hospital, X,
} from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Victim {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  injury_description?: string;
  injury_severity?: string;
  hospital_name?: string;
  hospital_address?: string;
  doctor_name?: string;
  medical_report_url?: string;
  compensation_status?: string;
  compensation_amount?: number;
  protection_required?: boolean;
  statement?: string;
  statement_date?: string;
  notes?: string;
  createdAt: string;
}

interface Case { id: string; case_number: string; title: string; }

const INJURY_SEVERITY: Record<string, { label: string; badge: string; color: string }> = {
  minor:    { label: 'Minor',    badge: 'badge-blue',   color: 'border-blue-500/40'   },
  moderate: { label: 'Moderate', badge: 'badge-yellow', color: 'border-yellow-500/40' },
  severe:   { label: 'Severe',   badge: 'badge-red',    color: 'border-red-500/40'    },
  fatal:    { label: 'Fatal',    badge: 'badge-red',    color: 'border-red-500/60'    },
  none:     { label: 'No Injury',badge: 'badge-slate',  color: 'border-base-border'   },
};

const COMPENSATION_STATUS = ['Pending', 'Applied', 'Under Review', 'Approved', 'Granted', 'Rejected', 'Not Applicable'];

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function VictimsPage() {
  const { id: caseId }  = useParams<{ id: string }>();
  const [searchParams]  = useSearchParams();
  const activeCaseId    = caseId || searchParams.get('case_id') || undefined;

  const [victims, setVictims]   = useState<Victim[]>([]);
  const [cases, setCases]       = useState<Case[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const [addOpen, setAddOpen]   = useState(false);
  const [editVictim, setEditVictim] = useState<Victim | null>(null);
  const [viewVictim, setViewVictim] = useState<Victim | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCaseId) params.case_id = activeCaseId;
      const res = await api.get('/victims', { params });
      setVictims(res.data as Victim[]);
    } catch { toast.error('Failed to load victims'); }
    finally { setLoading(false); }
  }, [activeCaseId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeCaseId) {
      api.get('/cases', { params: { limit: 100 } })
        .then((r) => setCases((r.data?.cases ?? r.data) as Case[] || []))
        .catch(() => {});
    }
  }, [activeCaseId]);

  const filtered = victims.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !search || v.full_name.toLowerCase().includes(q) || (v.phone || '').includes(q);
    const matchSev = sevFilter === 'all' || v.injury_severity === sevFilter;
    return matchSearch && matchSev;
  });

  const handleDelete = async (v: Victim) => {
    if (!window.confirm(`Delete victim record for "${v.full_name}"?`)) return;
    try { await api.delete(`/victims/${v.id}`); toast.success('Record deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fade} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {caseId && <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-1"><ArrowLeft className="w-4 h-4" /> Back to Case</Link>}
          <h1 className="page-title">Victims</h1>
          <p className="page-subtitle">
            {victims.length} recorded · {victims.filter((v) => v.protection_required).length} require protection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Victim</button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade} className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input pl-10 h-9" placeholder="Search by name or phone..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input h-9 w-auto" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
            <option value="all">All Injury Levels</option>
            {Object.entries(INJURY_SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fade} className="glass-panel p-16 text-center">
          <Heart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {victims.length === 0 ? 'No Victim Records' : 'No Results Found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            {victims.length === 0 ? 'Add victim profiles, injury reports, and statements.' : 'Try adjusting your filters.'}
          </p>
          {victims.length === 0 && <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add First Victim</button>}
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const sevCfg = INJURY_SEVERITY[v.injury_severity || 'none'];
            return (
              <motion.div key={v.id} variants={fade} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`glass-card flex flex-col overflow-hidden border-l-4 ${sevCfg.color}`}>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={sevCfg.badge + ' text-2xs'}>{sevCfg.label}</span>
                        {v.protection_required && <span className="badge-yellow text-2xs flex items-center gap-1"><Shield className="w-2.5 h-2.5" />Protected</span>}
                      </div>
                      <h3 className="text-sm font-bold text-white">{v.full_name}</h3>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {v.phone && <div className="flex items-center gap-2 text-xs text-slate-400"><Phone className="w-3.5 h-3.5" />{v.phone}</div>}
                    {v.address && <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{v.address}</span></div>}
                    {v.age && <div className="flex items-center gap-2 text-xs text-slate-400"><User className="w-3.5 h-3.5" />{v.age} yrs{v.gender ? ` · ${v.gender}` : ''}</div>}
                    {v.hospital_name && <div className="flex items-center gap-2 text-xs text-slate-400"><FileText className="w-3.5 h-3.5" />{v.hospital_name}</div>}
                  </div>

                  {v.injury_description && (
                    <p className="text-xs text-red-300/80 leading-relaxed line-clamp-2 border-t border-base-border pt-2">
                      Injury: {v.injury_description}
                    </p>
                  )}

                  {v.compensation_status && (
                    <p className="text-xs text-slate-400">Compensation: <span className="text-slate-200">{v.compensation_status}</span></p>
                  )}

                  <div className="flex gap-2 mt-auto pt-1">
                    <button onClick={() => setViewVictim(v)} className="btn-secondary btn-sm flex-1"><Eye className="w-3.5 h-3.5" /> View</button>
                    <button onClick={() => setEditVictim(v)} className="btn-icon w-8 h-8"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(v)} className="btn-icon w-8 h-8 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <VictimFormModal isOpen={addOpen} onClose={() => setAddOpen(false)} caseId={activeCaseId} cases={cases} onSuccess={load} />
      {editVictim && <VictimFormModal isOpen={true} victim={editVictim} onClose={() => setEditVictim(null)} caseId={activeCaseId} cases={cases} onSuccess={load} />}
      {viewVictim && <VictimDetailModal victim={viewVictim} onClose={() => setViewVictim(null)} />}
    </motion.div>
  );
}

/* ─── Form Modal ─────────────────────────────────────────────────────────── */
function VictimFormModal({ isOpen, victim, onClose, caseId, cases, onSuccess }: {
  isOpen: boolean; victim?: Victim | null; onClose: () => void;
  caseId?: string; cases: Case[]; onSuccess: () => void;
}) {
  const isEdit = !!victim;
  const [form, setForm] = useState({
    case_id: caseId || '',
    full_name: victim?.full_name || '',
    age: victim?.age?.toString() || '',
    gender: victim?.gender || '',
    phone: victim?.phone || '',
    email: victim?.email || '',
    address: victim?.address || '',
    occupation: victim?.occupation || '',
    injury_description: victim?.injury_description || '',
    injury_severity: victim?.injury_severity || 'none',
    hospital_name: victim?.hospital_name || '',
    hospital_address: victim?.hospital_address || '',
    doctor_name: victim?.doctor_name || '',
    compensation_status: victim?.compensation_status || '',
    compensation_amount: victim?.compensation_amount?.toString() || '',
    protection_required: victim?.protection_required || false,
    statement: victim?.statement || '',
    notes: victim?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const f = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    if (!isEdit && !caseId && !form.case_id) { toast.error('Select a case'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, case_id: caseId || form.case_id,
        age: form.age ? parseInt(form.age) : undefined,
        compensation_amount: form.compensation_amount ? parseFloat(form.compensation_amount) : undefined };
      if (isEdit) { await api.put(`/victims/${victim!.id}`, payload); toast.success('Record updated'); }
      else { await api.post('/victims', payload); toast.success('Victim record added'); }
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit — ${victim!.full_name}` : 'Add Victim'} size="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {!caseId && !isEdit && (
          <div>
            <label className="input-label">Case *</label>
            <select className="input" value={form.case_id} onChange={(e) => f('case_id', e.target.value)}>
              <option value="">Select a case...</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}
            </select>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="input-label">Full Name *</label><input className="input" value={form.full_name} onChange={(e) => f('full_name', e.target.value)} /></div>
          <div><label className="input-label">Age</label><input type="number" className="input" value={form.age} onChange={(e) => f('age', e.target.value)} min={1} max={120} /></div>
          <div><label className="input-label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
              <option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div><label className="input-label">Phone</label><input className="input" value={form.phone} onChange={(e) => f('phone', e.target.value)} /></div>
          <div><label className="input-label">Occupation</label><input className="input" value={form.occupation} onChange={(e) => f('occupation', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="input-label">Address</label><input className="input" value={form.address} onChange={(e) => f('address', e.target.value)} /></div>
          <div>
            <label className="input-label">Injury Severity</label>
            <select className="input" value={form.injury_severity} onChange={(e) => f('injury_severity', e.target.value)}>
              {Object.entries(INJURY_SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div><label className="input-label">Compensation Status</label>
            <select className="input" value={form.compensation_status} onChange={(e) => f('compensation_status', e.target.value)}>
              <option value="">Select...</option>
              {COMPENSATION_STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="input-label">Injury Description</label>
            <textarea rows={2} className="input resize-none" value={form.injury_description} onChange={(e) => f('injury_description', e.target.value)} placeholder="Nature and extent of injuries sustained" /></div>
          <div><label className="input-label">Hospital Name</label><input className="input" value={form.hospital_name} onChange={(e) => f('hospital_name', e.target.value)} /></div>
          <div><label className="input-label">Treating Doctor</label><input className="input" value={form.doctor_name} onChange={(e) => f('doctor_name', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="input-label">Statement</label>
            <textarea rows={3} className="input resize-none" value={form.statement} onChange={(e) => f('statement', e.target.value)} placeholder="Victim's statement about the incident" /></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
          <input type="checkbox" className="rounded" checked={form.protection_required} onChange={(e) => f('protection_required', e.target.checked)} />
          <Shield className="w-4 h-4 text-yellow-400" /> Protection Required
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Updating...' : 'Adding...'}</> : isEdit ? 'Update Victim' : 'Add Victim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
function VictimDetailModal({ victim: v, onClose }: { victim: Victim; onClose: () => void }) {
  const sevCfg = INJURY_SEVERITY[v.injury_severity || 'none'];
  return (
    <Modal isOpen={true} onClose={onClose} title={v.full_name} size="lg">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{v.full_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={sevCfg.badge + ' text-2xs'}>{sevCfg.label}</span>
              {v.protection_required && <span className="badge-yellow text-2xs"><Shield className="w-2.5 h-2.5 inline mr-0.5" />Protected</span>}
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: 'Age / Gender',         value: [v.age && `${v.age} yrs`, v.gender].filter(Boolean).join(' · ') },
            { label: 'Phone',                value: v.phone },
            { label: 'Occupation',           value: v.occupation },
            { label: 'Address',              value: v.address },
            { label: 'Hospital',             value: v.hospital_name },
            { label: 'Treating Doctor',      value: v.doctor_name },
            { label: 'Compensation Status',  value: v.compensation_status },
          ].map((r) => r.value ? (
            <div key={r.label} className="glass-card p-3">
              <p className="input-label mb-0.5">{r.label}</p>
              <p className="text-sm text-slate-200">{r.value}</p>
            </div>
          ) : null)}
        </div>
        {v.injury_description && <div className="glass-card p-3 border-l-4 border-red-500/40"><p className="input-label mb-1">Injury Description</p><p className="text-sm text-red-300">{v.injury_description}</p></div>}
        {v.statement && <div className="glass-card p-3"><p className="input-label mb-1">Statement</p><p className="text-sm text-slate-300 leading-relaxed">{v.statement}</p></div>}
      </div>
    </Modal>
  );
}
