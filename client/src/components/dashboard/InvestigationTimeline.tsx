import { motion } from 'framer-motion';
import { FileText, MapPin, Archive, Users, Gavel, CheckCircle2, Circle, Clock } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
  time: string;
  status: 'done' | 'active' | 'pending';
  note?: string;
}

interface Props {
  caseNumber?: string;
  steps?: Step[];
}

const defaultSteps: Step[] = [
  { id: '1', label: 'FIR Registered',      icon: FileText, time: '10:00 AM', status: 'done',    note: 'FIR No. registered' },
  { id: '2', label: 'Scene Visit',          icon: MapPin,   time: '11:30 AM', status: 'done',    note: 'Panchnama prepared' },
  { id: '3', label: 'Evidence Collected',   icon: Archive,  time: '02:00 PM', status: 'done',    note: '7 items seized' },
  { id: '4', label: 'Witness Statement',    icon: Users,    time: '04:00 PM', status: 'active',  note: 'In progress' },
  { id: '5', label: 'FSL Report',           icon: Gavel,    time: 'Pending',  status: 'pending', note: 'Awaiting FSL' },
  { id: '6', label: 'Chargesheet',          icon: FileText, time: 'Pending',  status: 'pending', note: '60 days deadline' },
];

const STATUS_STYLES = {
  done:    { ring: 'bg-green-500/20 border-green-500/40', icon: 'text-green-400', dot: 'bg-green-400', line: 'bg-green-500/40' },
  active:  { ring: 'bg-primary-500/20 border-primary-500/40 shadow-glow-sm', icon: 'text-primary-400', dot: 'bg-primary-400', line: 'bg-[#1E293B]' },
  pending: { ring: 'bg-[#1A2332] border-[#1E293B]', icon: 'text-slate-600', dot: 'bg-slate-700', line: 'bg-[#1E293B]' },
};

export default function InvestigationTimeline({ caseNumber, steps = defaultSteps }: Props) {
  const completedCount = steps.filter((s) => s.status === 'done').length;
  const pct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Investigation Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {caseNumber ?? 'Active case'} · {completedCount}/{steps.length} steps · {pct}% complete
          </p>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          <span className="text-xs font-semibold text-primary-400">{pct}%</span>
        </div>
      </div>

      <div className="card-body">
        {/* Horizontal timeline */}
        <div className="flex items-start gap-0 overflow-x-auto no-scrollbar pb-2">
          {steps.map((step, i) => {
            const styles = STATUS_STYLES[step.status];
            const StepIcon = step.status === 'done'
              ? CheckCircle2
              : step.status === 'active'
              ? Clock
              : Circle;

            return (
              <div key={step.id} className="flex items-start flex-shrink-0 min-w-0">
                {/* Step node */}
                <div className="flex flex-col items-center">
                  {/* Icon circle */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center
                                flex-shrink-0 ${styles.ring}`}
                  >
                    {step.status === 'active' && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl border border-primary-500/40"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <step.icon className={`w-5 h-5 ${styles.icon}`} />
                  </motion.div>

                  {/* Dot */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 ${styles.dot}`} />

                  {/* Label + time */}
                  <div className="mt-2 text-center max-w-[80px]">
                    <p className={`text-[11px] font-semibold leading-tight ${
                      step.status === 'pending' ? 'text-slate-600' : 'text-slate-300'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{step.time}</p>
                    {step.note && (
                      <p className={`text-[10px] mt-0.5 ${
                        step.status === 'done' ? 'text-green-500/70'
                        : step.status === 'active' ? 'text-primary-400/70'
                        : 'text-slate-700'
                      }`}>
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="flex-1 min-w-8 max-w-16 mt-6 mx-1">
                    <div className={`h-0.5 w-full ${styles.line} rounded-full`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
