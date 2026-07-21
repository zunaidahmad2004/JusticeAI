import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, Lock, Zap, TrendingUp, Users, Clock, Award, ChevronLeft, ChevronRight, Fingerprint, Eye } from 'lucide-react';

const slides = [
  { id:1, type:'hero' as const, content:{ title:'Helping Investigators.', subtitle:'Supporting Justice.', description:'Enterprise AI platform for law enforcement, forensic teams, and legal professionals. Powered by Gemini 2.5 Flash.' } },
  { id:2, type:'features' as const, title:'Platform Capabilities',
    items:[
      { icon:Cpu,         title:'AI-Powered Analysis',  desc:'Extract insights from case data using advanced AI' },
      { icon:Lock,        title:'Secure & Encrypted',    desc:'Bank-grade security for all case files and evidence' },
      { icon:Zap,         title:'Smart Automation',      desc:'Automate routine tasks, focus on delivering justice' },
      { icon:Fingerprint, title:'Digital Forensics',     desc:'Deep analysis of digital artifacts and evidence' },
    ],
  },
  { id:3, type:'stats' as const, title:'Platform Performance',
    items:[
      { value:'10,289+', label:'Cases Analyzed',  icon:TrendingUp },
      { value:'98.7%',   label:'AI Accuracy',     icon:Award     },
      { value:'5,623+',  label:'Active Officers', icon:Users     },
      { value:'12.4K+',  label:'Hours Saved',     icon:Clock     },
    ],
  },
];

function Particle({ x, y, size, dur, delay }: { x:number; y:number; size:number; dur:number; delay:number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left:`${x}%`, top:`${y}%`, width:size, height:size, background:'rgba(124,92,255,0.18)', filter:'blur(1px)' }}
      animate={{ y:[0,-18,0], opacity:[0.2,0.6,0.2], scale:[1,1.5,1] }}
      transition={{ duration:dur, repeat:Infinity, delay, ease:'easeInOut' }}
    />
  );
}

const PARTICLES = Array.from({length:14}, (_,i) => ({
  x:(i*29+9)%88, y:(i*19+13)%85, size:2+(i%5)*2, dur:4+i%6, delay:i*0.35,
}));

export default function AuthLayout() {
  const [slide, setSlide] = useState(0);
  const s = slides[slide];

  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p+1) % slides.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background:'#09090B' }}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col relative overflow-hidden flex-shrink-0"
        style={{ background:'linear-gradient(145deg, #0D0D10 0%, #09090B 100%)', borderRight:'1px solid rgba(255,255,255,0.04)' }}>
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
        {/* Aurora */}
        <motion.div animate={{ scale:[1,1.3,1], opacity:[0.06,0.14,0.06] }} transition={{ duration:10, repeat:Infinity, ease:'easeInOut' }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background:'radial-gradient(circle, rgba(124,92,255,0.3), transparent 70%)' }} />
        <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.03,0.08,0.03] }} transition={{ duration:14, repeat:Infinity, ease:'easeInOut', delay:2 }}
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"
          style={{ background:'radial-gradient(circle, rgba(91,140,255,0.25), transparent 70%)' }} />
        {PARTICLES.map((p,i) => <Particle key={i} {...p} />)}

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <div className="mb-14">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-glow"
                style={{ background:'linear-gradient(135deg, #7C5CFF, #5B8CFF)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-white tracking-tight">JusticeAI</p>
                <p className="text-xs text-slate-600 font-medium">Investigation Platform</p>
              </div>
            </div>
          </div>

          {/* Slide */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <AnimatePresence mode="wait">
              <motion.div key={s.id}
                initial={{ opacity:0, x:-24, filter:'blur(4px)' }}
                animate={{ opacity:1, x:0, filter:'blur(0px)' }}
                exit={{ opacity:0, x:24, filter:'blur(4px)' }}
                transition={{ duration:0.4, ease:[0.4,0,0.2,1] }}
              >
                {s.type==='hero' && (
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                      style={{ background:'rgba(124,92,255,0.1)', border:'1px solid rgba(124,92,255,0.2)' }}>
                      <Zap className="w-3.5 h-3.5 text-primary-400" />
                      <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">Next-Gen Forensics</span>
                    </div>
                    <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">
                      {s.content.title}<br />
                      <span className="text-gradient-multi animate-gradient-shift">{s.content.subtitle}</span>
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed font-light">{s.content.description}</p>
                  </div>
                )}
                {s.type==='features' && (
                  <div>
                    <h2 className="text-xl font-extrabold text-white mb-7 tracking-tight">{s.title}</h2>
                    <div className="space-y-5">
                      {s.items.map((item,i) => (
                        <motion.div key={i} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                          className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background:'rgba(124,92,255,0.12)', border:'1px solid rgba(124,92,255,0.2)' }}>
                            <item.icon className="w-4 h-4 text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                            <p className="text-xs text-slate-600 font-light leading-relaxed">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {s.type==='stats' && (
                  <div>
                    <h2 className="text-xl font-extrabold text-white mb-7 tracking-tight">{s.title}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {s.items.map((stat,i) => (
                        <motion.div key={i} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.1}}
                          className="rounded-xl p-4"
                          style={{ background:'rgba(22,27,34,0.7)', border:'1px solid rgba(124,92,255,0.12)' }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <stat.icon className="w-3.5 h-3.5 text-primary-400" />
                            <span className="text-xl font-extrabold text-white tabular-nums">{stat.value}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Slide controls */}
            <div className="flex items-center justify-between mt-12">
              <div className="flex items-center gap-2">
                {slides.map((_,i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ width: i===slide ? '28px' : '6px', background: i===slide ? '#7C5CFF' : 'rgba(124,92,255,0.25)' }} />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {[ChevronLeft, ChevronRight].map((Icon, i) => (
                  <button key={i}
                    onClick={() => setSlide(p => i===0 ? (p-1+slides.length)%slides.length : (p+1)%slides.length)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-all"
                    style={{ background:'rgba(28,35,51,0.8)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Security notice */}
          <div className="mt-auto">
            <div className="rounded-xl p-4 flex items-start gap-2.5"
              style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.12)' }}>
              <Eye className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="text-yellow-500 font-bold">Restricted Access.</span>{' '}
                Authorized law enforcement and legal personnel only. All access is logged.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg, #7C5CFF, #5B8CFF)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white">JusticeAI</span>
              <p className="text-xs text-slate-600">Investigation Platform</p>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
