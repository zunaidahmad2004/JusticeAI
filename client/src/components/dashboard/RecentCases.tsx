import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Folder, AlertCircle, Clock, CheckCircle2, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  crime_type?: string;
  updated_at: string;
  io_name?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  open:               { icon: Folder,       color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Open' },
  under_investigation:{ icon: AlertCircle,  color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Active' },
  chargesheet_filed:  { icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Filed' },
  closed:             { icon: CheckCircle2, color: 'text-slate-400',  bg: 'bg-slate-500/10',  label: 'Closed' },
  archived:           { icon: Archive,      color: 'text-slate-500',  bg: 'bg-slate-500/10',  label: 'Archived' },
};

const PRIORITY_CONFIG: Record<string, { label: string; class: string }> = {
  critical: { label: 'Critical', class: 'badge-red' },
  high:     { label: 'High',     class: 'badge-yellow' },
  medium:   { label: 'Medium',   class: 'badge-blue' },
  low:      { label: 'Low',      class: 'badge-slate' },
};

interface Props {
  cases: Case[];
  loading?: boolean;
}

export default function RecentCases({ cases, loading }: Props) {
  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Recent Cases</h2>
          <p className="text-xs text-slate-500 mt-0.5">{cases.length} most recent</p>
        </div>
        <Link
          to="/cases"
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300
                     transition-colors font-medium"
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Folder className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No cases yet</p>
            <Link to="/cases/new" className="text-xs text-primary-400 mt-1 hover:underline">Create first case →</Link>
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {cases.map((c, i) => {
              const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
              const priority = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.medium;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/cases/${c.id}`}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#1A2332]
                               transition-all duration-200 group"
                  >
                    {/* Status icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-primary-400 flex-shrink-0">
                          {c.case_number}
                        </span>
                        <span className={`${priority.class} text-[10px]`}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white
                                    transition-colors">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.crime_type && (
                          <span className="text-[10px] text-slate-500">{c.crime_type}</span>
                        )}
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* View button */}
                    <button className="opacity-0 group-hover:opacity-100 btn-icon w-7 h-7
                                       flex-shrink-0 transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary-400" />
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
