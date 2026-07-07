import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Calendar, Plus, Clock, MapPin, Gavel, ChevronLeft,
  ChevronRight, RefreshCw, FolderOpen, CheckCircle2,
  AlertTriangle, XCircle, Edit, Trash2, X,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';

interface CourtHearing {
  id: string;
  case_id: { _id: string; case_number: string; title: string; crime_type?: string } | string;
  title: string;
  court_name: string;
  court_number?: string;
  judge_name?: string;
  hearing_date: string;
  hearing_time?: string;
  hearing_type: string;
  status: 'scheduled' | 'completed' | 'adjourned' | 'cancelled';
  result?: string;
  next_date?: string;
  notes?: string;
}

interface HearingForm {
  case_id: string;
  title: string;
  court_name: string;
  court_number: string;
  judge_name: string;
  hearing_date: string;
  hearing_time: string;
  hearing_type: string;
  notes: string;
}

interface Case { id: string; case_number: string; title: string; }

const STATUS_CFG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  scheduled:  { label: 'Scheduled',  badge: 'badge-blue',   icon: Clock        },
  completed:  { label: 'Completed',  badge: 'badge-green',  icon: CheckCircle2 },
  adjourned:  { label: 'Adjourned',  badge: 'badge-yellow', icon: AlertTriangle },
  cancelled:  { label: 'Cancelled',  badge: 'badge-slate',  icon: XCircle      },
};

const HEARING_TYPES = [
  { value: 'bail',              label: 'Bail Hearing'         },
  { value: 'framing_of_charges',label: 'Framing of Charges'  },
  { value: 'evidence',          label: 'Evidence Recording'  },
  { value: 'argument',          label: 'Final Arguments'      },
  { value: 'judgment',          label: 'Judgment'             },
  { value: 'other',             label: 'Other'                },
];

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

export default function CourtCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hearings, setHearings]         = useState<CourtHearing[]>([]);
  const [upcoming, setUpcoming]         = useState<CourtHearing[]>([]);
  const [cases, setCases]               = useState<Case[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [editHearing, setEditHearing]   = useState<CourtHearing | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const emptyForm: HearingForm = {
    case_id: '', title: '', court_name: '', court_number: '',
    judge_name: '', hearing_date: '', hearing_time: '',
    hearing_type: 'other', notes: '',
  };
  const [form, setForm] = useState<HearingForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const to   = format(endOfMonth(currentMonth),   'yyyy-MM-dd');
      const [hRes, uRes, cRes] = await Promise.all([
        api.get('/court-hearings', { params: { from, to } }),
        api.get('/court-hearings/upcoming'),
        api.get('/cases', { params: { limit: 100 } }),
      ]);
      setHearings(hRes.data as CourtHearing[]);
      setUpcoming(uRes.data as CourtHearing[]);
      setCases(((cRes.data?.cases ?? cRes.data) as Case[]) || []);
    } catch {
      toast.error('Failed to load hearings');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();

  const hearingsOnDay = (day: Date) =>
    hearings.filter((h) => isSameDay(parseISO(h.hearing_date), day));

  const openAdd = (day?: Date) => {
    setEditHearing(null);
    setForm({ ...emptyForm, hearing_date: day ? format(day, 'yyyy-MM-dd') : '' });
    setShowModal(true);
  };

  const openEdit = (h: CourtHearing) => {
    const cid = typeof h.case_id === 'object' ? h.case_id._id : h.case_id;
    setEditHearing(h);
    setForm({
      case_id:      cid,
      title:        h.title,
      court_name:   h.court_name,
      court_number: h.court_number || '',
      judge_name:   h.judge_name   || '',
      hearing_date: format(parseISO(h.hearing_date), 'yyyy-MM-dd'),
      hearing_time: h.hearing_time || '',
      hearing_type: h.hearing_type,
      notes:        h.notes        || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.case_id || !form.title || !form.court_name || !form.hearing_date) {
      toast.error('Case, title, court name and date are required'); return;
    }
    setSubmitting(true);
    try {
      if (editHearing) {
        await api.put(`/court-hearings/${editHearing.id}`, form);
        toast.success('Hearing updated');
      } else {
        await api.post('/court-hearings', form);
        toast.success('Hearing scheduled');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to save hearing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this hearing?')) return;
    try {
      await api.delete(`/court-hearings/${id}`);
      toast.success('Hearing deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/court-hearings/${id}`, { status });
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const selectedHearings = selectedDay ? hearingsOnDay(selectedDay) : [];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fade} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Court Calendar</h1>
          <p className="page-subtitle">Manage hearing dates, deadlines, and court appearances</p>
        </div>
        <button onClick={() => openAdd()} className="btn-primary">
          <Plus className="w-4 h-4" /> Schedule Hearing
        </button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Calendar */}
        <motion.div variants={fade} className="xl:col-span-2 glass-card overflow-hidden">
          {/* Month navigation */}
          <div className="px-6 py-4 border-b border-base-border flex items-center justify-between">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-icon w-8 h-8">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(new Date())} className="btn-ghost btn-sm text-xs">Today</button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-icon w-8 h-8">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-base-border">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="py-2 text-center text-2xs font-bold text-slate-600 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 border-b border-r border-base-border/50 bg-base-surface/20" />
            ))}

            {days.map((day) => {
              const dayHearings = hearingsOnDay(day);
              const isSelected  = selectedDay && isSameDay(day, selectedDay);
              const today       = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                  className={`h-20 border-b border-r border-base-border/50 p-1.5 cursor-pointer transition-colors
                    ${isSelected ? 'bg-navy-500/20 border-navy-500/30' : 'hover:bg-base-elevated'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1
                    ${today ? 'bg-navy-500 text-white' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayHearings.slice(0, 2).map((h) => (
                      <div
                        key={h.id}
                        className={`text-2xs px-1 py-0.5 rounded truncate font-medium
                          ${h.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300'
                          : h.status === 'completed' ? 'bg-green-500/20 text-green-300'
                          : h.status === 'adjourned' ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-slate-500/20 text-slate-400'}`}
                      >
                        {h.title}
                      </div>
                    ))}
                    {dayHearings.length > 2 && (
                      <div className="text-2xs text-slate-600 px-1">+{dayHearings.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right panel: Selected day / Upcoming */}
        <motion.div variants={fade} className="space-y-4">

          {/* Selected day hearings */}
          {selectedDay && (
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-base-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{format(selectedDay, 'dd MMM yyyy')}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => openAdd(selectedDay)} className="btn-primary btn-sm text-xs">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                  <button onClick={() => setSelectedDay(null)} className="btn-icon w-6 h-6">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {selectedHearings.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No hearings on this day</p>
                  <button onClick={() => openAdd(selectedDay)} className="btn-secondary btn-sm mt-3">
                    Schedule Hearing
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-base-border/50">
                  {selectedHearings.map((h) => <HearingCard key={h.id} h={h} onEdit={openEdit} onDelete={handleDelete} onStatusChange={updateStatus} />)}
                </div>
              )}
            </div>
          )}

          {/* Upcoming 30 days */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-base-border flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Upcoming (30 days)</h3>
              <span className="badge-blue text-2xs ml-auto">{upcoming.length}</span>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming hearings</p>
              </div>
            ) : (
              <div className="divide-y divide-base-border/50 max-h-96 overflow-y-auto scroll-area">
                {upcoming.map((h) => {
                  const caseObj = typeof h.case_id === 'object' ? h.case_id : null;
                  return (
                    <div key={h.id} className="px-4 py-3 hover:bg-base-elevated transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{h.title}</p>
                          <p className="text-xs text-slate-500 truncate">{h.court_name}</p>
                          {caseObj && (
                            <Link to={`/cases/${caseObj._id}`} className="text-2xs text-navy-400 hover:underline">
                              {caseObj.case_number}
                            </Link>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-white">{format(parseISO(h.hearing_date), 'dd MMM')}</p>
                          {h.hearing_time && <p className="text-2xs text-slate-500">{h.hearing_time}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl w-full max-w-lg border border-base-border shadow-card"
          >
            <div className="px-6 py-4 border-b border-base-border flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editHearing ? 'Edit Hearing' : 'Schedule Court Hearing'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-icon w-8 h-8">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="input-label">Case *</label>
                <select className="input" value={form.case_id} onChange={(e) => setForm({ ...form, case_id: e.target.value })}>
                  <option value="">Select case...</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Hearing Title *</label>
                <input className="input" placeholder="e.g. Bail Hearing — State vs Sharma" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Court Name *</label>
                  <input className="input" placeholder="e.g. Sessions Court, Delhi" value={form.court_name}
                    onChange={(e) => setForm({ ...form, court_name: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Court Room No.</label>
                  <input className="input" placeholder="Court No. 5" value={form.court_number}
                    onChange={(e) => setForm({ ...form, court_number: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Date *</label>
                  <input type="date" className="input" value={form.hearing_date}
                    onChange={(e) => setForm({ ...form, hearing_date: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Time</label>
                  <input type="time" className="input" value={form.hearing_time}
                    onChange={(e) => setForm({ ...form, hearing_time: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Hearing Type</label>
                  <select className="input" value={form.hearing_type}
                    onChange={(e) => setForm({ ...form, hearing_type: e.target.value })}>
                    {HEARING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Judge Name</label>
                  <input className="input" placeholder="Hon. Justice..." value={form.judge_name}
                    onChange={(e) => setForm({ ...form, judge_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="input-label">Notes</label>
                <textarea rows={2} className="input resize-none" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : editHearing ? 'Update Hearing' : 'Schedule Hearing'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function HearingCard({ h, onEdit, onDelete, onStatusChange }: {
  h: CourtHearing;
  onEdit: (h: CourtHearing) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const cfg    = STATUS_CFG[h.status] || STATUS_CFG.scheduled;
  const Icon   = cfg.icon;
  const caseObj = typeof h.case_id === 'object' ? h.case_id : null;

  return (
    <div className="px-4 py-3 hover:bg-base-elevated transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cfg.badge + ' text-2xs flex items-center gap-1'}>
              <Icon className="w-3 h-3" />{cfg.label}
            </span>
            <span className="badge-slate text-2xs">{HEARING_TYPES.find((t) => t.value === h.hearing_type)?.label || h.hearing_type}</span>
          </div>
          <p className="text-sm font-bold text-white">{h.title}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Gavel className="w-3 h-3" />{h.court_name}
            </span>
            {h.hearing_time && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />{h.hearing_time}
              </span>
            )}
          </div>
          {caseObj && (
            <Link to={`/cases/${caseObj._id}`} className="text-xs text-navy-400 hover:underline mt-1 block">
              {caseObj.case_number} — {caseObj.title}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(h)} className="btn-icon w-7 h-7"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(h.id)} className="btn-icon w-7 h-7 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {h.status === 'scheduled' && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => onStatusChange(h.id, 'completed')} className="btn-secondary btn-sm text-xs flex-1">Mark Complete</button>
          <button onClick={() => onStatusChange(h.id, 'adjourned')} className="btn-secondary btn-sm text-xs flex-1">Adjourned</button>
        </div>
      )}
    </div>
  );
}
