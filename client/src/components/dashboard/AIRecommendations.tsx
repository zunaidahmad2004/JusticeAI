import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Recommendation {
  id: string;
  text: string;
  priority: 'critical' | 'high' | 'medium';
  done: boolean;
  category: string;
}

const DEFAULT_RECS: Recommendation[] = [
  { id: '1', text: 'Collect CCTV footage from 500m radius of crime scene', priority: 'critical', done: false, category: 'Evidence' },
  { id: '2', text: 'Record Section 180 BNSS statements from all eyewitnesses', priority: 'high', done: false, category: 'Witnesses' },
  { id: '3', text: 'Send fingerprint samples to Forensic Science Laboratory', priority: 'high', done: false, category: 'Forensics' },
  { id: '4', text: 'Recover and seize weapon/instrument used in offence', priority: 'critical', done: false, category: 'Evidence' },
  { id: '5', text: 'Request mobile tower data and CDR from telecom operator', priority: 'medium', done: false, category: 'Digital' },
  { id: '6', text: 'Obtain Medico-Legal Certificate from treating doctor', priority: 'high', done: false, category: 'Medical' },
  { id: '7', text: 'Prepare detailed site plan with compass directions', priority: 'medium', done: false, category: 'Documentation' },
];

const PRIORITY_STYLES = {
  critical: 'text-red-400',
  high:     'text-yellow-400',
  medium:   'text-blue-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  Evidence:      'bg-red-500/10 text-red-400',
  Witnesses:     'bg-blue-500/10 text-blue-400',
  Forensics:     'bg-purple-500/10 text-purple-400',
  Digital:       'bg-cyan-500/10 text-cyan-400',
  Medical:       'bg-green-500/10 text-green-400',
  Documentation: 'bg-yellow-500/10 text-yellow-400',
};

export default function AIRecommendations() {
  const [recs, setRecs] = useState<Recommendation[]>(DEFAULT_RECS);

  const toggle = (id: string) => {
    setRecs((prev) => prev.map((r) => r.id === id ? { ...r, done: !r.done } : r));
  };

  const completedCount = recs.filter((r) => r.done).length;

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Recommendations</h2>
            <p className="text-xs text-slate-500 mt-0.5">{completedCount}/{recs.length} addressed</p>
          </div>
        </div>
        <button
          onClick={() => setRecs(DEFAULT_RECS)}
          className="btn-icon w-7 h-7"
          title="Reset"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area p-3 space-y-1">
        {recs.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => toggle(rec.id)}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                        transition-all duration-200 group
                        ${rec.done ? 'opacity-40' : 'hover:bg-[#1A2332]'}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {rec.done
                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : (
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                  transition-colors group-hover:border-primary-400 ${
                    rec.priority === 'critical' ? 'border-red-500/60'
                    : rec.priority === 'high' ? 'border-yellow-500/60'
                    : 'border-blue-500/40'
                  }`} />
                )
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium leading-snug transition-colors ${
                rec.done
                  ? 'line-through text-slate-600'
                  : 'text-slate-300 group-hover:text-white'
              }`}>
                {rec.text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-semibold capitalize ${PRIORITY_STYLES[rec.priority]}`}>
                  {rec.priority}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[rec.category] || 'bg-slate-500/10 text-slate-400'}`}>
                  {rec.category}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-3 border-t border-[#1E293B]">
        <Link
          to="/ai-chat"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     bg-primary-600/10 hover:bg-primary-600/20 border border-primary-500/20
                     hover:border-primary-500/40 text-primary-400 text-xs font-semibold
                     transition-all duration-200 group"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask AI Assistant
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
