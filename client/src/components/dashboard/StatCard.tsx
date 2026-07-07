import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
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

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendLabel = 'vs last month',
  accentColor = '#6366F1',
  delay = 0,
  onClick,
}: StatCardProps) {
  const isPositive = (trend ?? 0) > 0;
  const isNeutral  = trend === 0 || trend === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer group
                 glass-card rounded-2xl p-5 flex flex-col gap-3"
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${accentColor}08, transparent 65%)` }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)` }}
      />

      {/* ── ROW 1: Icon  +  Trend badge ─────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between">

        {/* Compact icon — 40 × 40 */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}
                      transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>

        {/* Trend badge — 26–28px tall */}
        {trend !== undefined && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold leading-none h-[26px] ${
              isNeutral
                ? 'text-slate-400 bg-slate-500/10'
                : isPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
            }`}
          >
            {isNeutral
              ? <Minus className="w-3 h-3" />
              : isPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {isNeutral ? '0%' : `${Math.abs(trend)}%`}
          </div>
        )}
      </div>

      {/* ── ROW 2: Big number ───────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.15 }}
        className="relative z-10 text-[52px] font-bold text-white leading-none tracking-tight tabular-nums"
      >
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </motion.p>

      {/* ── ROW 3: Title + sub-label ────────────────────────────────── */}
      <div className="relative z-10">
        <p className="text-[13px] font-semibold text-slate-300 uppercase tracking-wide leading-tight">
          {title}
        </p>
        {trend !== undefined && (
          <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{trendLabel}</p>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
      />
    </motion.div>
  );
}
