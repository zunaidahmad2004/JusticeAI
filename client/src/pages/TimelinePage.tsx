import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  performed_by_name?: string;
  is_milestone: boolean;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  case_created: 'bg-blue-500',
  evidence_uploaded: 'bg-green-500',
  witness_interviewed: 'bg-yellow-500',
  suspect_identified: 'bg-red-500',
  fir_registered: 'bg-primary-500',
  chargesheet_filed: 'bg-purple-500',
  court_hearing: 'bg-orange-500',
  investigation_update: 'bg-slate-500',
  milestone: 'bg-gold-500',
};

export default function TimelinePage() {
  const { id: caseId } = useParams<{ id: string }>();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/cases/${caseId}/timeline`);
    setEvents(res.data as TimelineEvent[]);
    setLoading(false);
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-2">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Case
          </Link>
          <h1 className="page-title">Investigation Timeline</h1>
          <p className="page-subtitle">Chronological case history</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon className="w-4 h-4" /> Add Event
        </button>
      </div>

      {loading ? <PageLoader /> : events.length === 0 ? (
        <EmptyState icon={ClockIcon} title="No timeline events" description="Add events to track the investigation chronology." action={<button className="btn-primary" onClick={() => setAddOpen(true)}>Add Event</button>} />
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800" />

          <div className="space-y-6 pl-16">
            {events.map((event) => {
              const dotColor = EVENT_TYPE_COLORS[event.event_type] || 'bg-slate-600';
              return (
                <div key={event.id} className="relative">
                  {/* Dot */}
                  <div className={`absolute -left-[46px] w-3 h-3 rounded-full ${dotColor} ring-2 ring-slate-900 top-1.5`} />

                  <div className={`card p-4 ${event.is_milestone ? 'border-primary-800/60 bg-primary-900/10' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.is_milestone && (
                            <span className="badge bg-primary-900/40 text-primary-300 border border-primary-800 text-xs">Milestone</span>
                          )}
                          <span className="text-xs text-slate-500 capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                        </div>
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                        )}
                        {event.performed_by_name && (
                          <p className="text-xs text-slate-500 mt-2">By: {event.performed_by_name}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-slate-300">
                          {event.event_date ? (() => { try { return format(new Date(event.event_date), 'dd MMM yyyy'); } catch { return '—'; } })() : '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {event.event_date ? (() => { try { return format(new Date(event.event_date), 'HH:mm'); } catch { return ''; } })() : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddEventModal isOpen={addOpen} onClose={() => setAddOpen(false)} caseId={caseId!} onSuccess={load} />
    </div>
  );
}

function AddEventModal({ isOpen, onClose, caseId, onSuccess }: { isOpen: boolean; onClose: () => void; caseId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({ event_type: 'investigation_update', title: '', description: '', event_date: new Date().toISOString().slice(0, 16), is_milestone: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/cases/${caseId}/timeline`, form);
      toast.success('Event added');
      onSuccess(); onClose();
    } finally { setSubmitting(false); }
  };

  const f = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Timeline Event" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="form-group">
          <label className="input-label">Event Type</label>
          <select className="input" value={form.event_type} onChange={(e) => f('event_type', e.target.value)}>
            {['investigation_update', 'evidence_uploaded', 'witness_interviewed', 'suspect_identified', 'fir_registered', 'chargesheet_filed', 'court_hearing', 'milestone'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="input-label">Title *</label>
          <input className="input" value={form.title} onChange={(e) => f('title', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="input-label">Description</label>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => f('description', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="input-label">Date & Time</label>
          <input type="datetime-local" className="input" value={form.event_date} onChange={(e) => f('event_date', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.is_milestone} onChange={(e) => f('is_milestone', e.target.checked)} className="rounded" />
          Mark as Milestone
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Adding...' : 'Add Event'}</button>
        </div>
      </form>
    </Modal>
  );
}
