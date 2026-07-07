import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, Lock, Zap, TrendingUp, Users, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    type: 'hero' as const,
    content: {
      title: 'Helping Investigators.',
      subtitle: 'Supporting Justice.',
      description:
        'AI-powered criminal investigation and legal decision support platform for law enforcement professionals, prosecutors, and legal researchers.',
    },
  },
  {
    id: 2,
    type: 'features' as const,
    title: 'Platform Features',
    items: [
      {
        icon: Cpu,
        title: 'AI-Powered Analysis',
        desc: 'Extract insights from complex case data using advanced AI',
      },
      {
        icon: Lock,
        title: 'Secure & Reliable',
        desc: 'Bank-grade encryption and role-based access for all case files',
      },
      {
        icon: Zap,
        title: 'Smart Automation',
        desc: 'Automate routine tasks, save time, and focus on delivering justice',
      },
    ],
  },
  {
    id: 3,
    type: 'stats' as const,
    title: 'Platform Performance',
    items: [
      { value: '10,289+', label: 'Cases Analyzed', icon: TrendingUp },
      { value: '98.7%', label: 'Accuracy Rate', icon: Award },
      { value: '5,623+', label: 'Active Officers', icon: Users },
      { value: '12.4K+', label: 'Hours Saved', icon: Clock },
    ],
  },
];

export default function AuthLayout() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-base-bg flex">
      {/* ════════════════════════════════════════════════════════════════════
          LEFT CAROUSEL PANEL
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[580px] flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-base-bg to-slate-950 flex-shrink-0">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Animated blue glow orb */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-navy-600/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo - Always Visible */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">JusticeAI</p>
                <p className="text-xs text-slate-500 font-medium">Investigation Platform</p>
              </div>
            </div>
          </div>

          {/* Carousel Content - Animated Slides */}
          <div className="flex-1 flex flex-col justify-center max-w-md relative">
            <AnimatePresence mode="wait">
              {slide.type === 'hero' && (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-4xl font-bold text-white leading-tight mb-6 tracking-tight">
                    {slide.content.title}
                    <br />
                    <span className="text-gradient-navy">{slide.content.subtitle}</span>
                  </h1>
                  <p className="text-base text-slate-400 leading-relaxed">{slide.content.description}</p>
                </motion.div>
              )}

              {slide.type === 'features' && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">{slide.title}</h2>
                  <div className="space-y-6">
                    {slide.items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-11 h-11 rounded-xl bg-navy-500/10 border border-navy-500/20 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-navy-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {slide.type === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">{slide.title}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {slide.items.map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-5"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <stat.icon className="w-4 h-4 text-navy-400" />
                          <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                        </div>
                        <p className="text-2xs text-slate-500 font-medium uppercase tracking-wider">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carousel Navigation */}
            <div className="flex items-center justify-between mt-12">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? 'w-8 bg-navy-500'
                        : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Arrow Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="w-8 h-8 rounded-lg bg-base-elevated hover:bg-base-hover border border-base-border flex items-center justify-center transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-8 h-8 rounded-lg bg-base-elevated hover:bg-base-hover border border-base-border flex items-center justify-center transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Notice - Always Visible */}
          <div className="mt-auto pt-8">
            <div className="glass-card p-4 border-l-4 border-yellow-500/30">
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="text-yellow-400 font-semibold">
                  ⚠ For authorized law enforcement and legal personnel only.
                </span>
                <br />
                All access is logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT FORM PANEL
          ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-base-bg">
        <div className="w-full max-w-md">
          {/* Mobile Logo (hidden on desktop) */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">JusticeAI</span>
              <p className="text-xs text-slate-500">Investigation Platform</p>
            </div>
          </div>

          {/* Form Content (Login/Register via Outlet) */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
