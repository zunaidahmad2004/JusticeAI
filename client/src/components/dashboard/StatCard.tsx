import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: number;
  trendLabel?: string;
  accentColor?: string;
  delay?: number;
  onClick?: () => void;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const end = value;
    if (end === 0) return;
    const dur = 900;
    const step = Math.ceil(end / 60);
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { clearInterval(t); setDisplay(end); }
      else setDisplay(cur);
    }, dur / (end / step));
  }, [value]);

  return <span className="tabular-nums">{display.toLocaleString('en-IN')}</span>;
}

export default function StatCard({ title, value, icon:Icon, iconColor, iconBg, trend, trendLabel='vs last month', accentColor='#6366F1', delay=0, onClick }: Props) {
  const isNum = typeof value === 'number';
  const isPos = (trend ?? 0) > 0;
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
  };

  return (
    <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, delay, ease:[0.4,0,0.2,1] }}
      whileHover={{ y:-4, transition:{ duration:0.2 } }}
      onClick={onClick} onMouseMove={handleMove}
      className="glass-card-hover relative overflow-hidden cursor-pointer rounded-2xl p-5 flex flex-col gap-4"
      style={{ borderColor:'rgba(255,255,255,0.05)' }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px" style={{ background:`linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ background:`${iconBg}`, boxShadow:`0 0 16px ${accentColor}20` }}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
          {isNum ? <AnimatedNumber value={value as number} /> : value}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1.5 uppercase tracking-wider">{title}</p>
        {trend !== undefined && trendLabel && (
          <p className="text-[10px] text-slate-700 mt-0.5">{trendLabel}</p>
        )}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background:`linear-gradient(to top, ${accentColor}06, transparent)` }} />
    </motion.div>
  );
}
