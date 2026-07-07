import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import {
  Shield, FileText, Archive, Fingerprint, Scale, BarChart3,
  ArrowRight, Play, CheckCircle, TrendingUp, Users, Building2,
  Menu, X, Quote, ChevronRight, Sparkles, Zap, Clock,
  Camera, Car, Phone, BookOpen, Briefcase, Video,
  Target, MapPin, Mail, PhoneCall, Globe, Send, AlertCircle,
  Eye, Cpu, Lock, Star, Award,
} from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};
const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const NAV_ITEMS = [
  { label: 'Home',      href: '#home'      },
  { label: 'Features',  href: '#features'  },
  { label: 'Solutions', href: '#solutions' },
  { label: 'About',     href: '#about'     },
  { label: 'Contact',   href: '#contact'   },
];

const SOLUTIONS = [
  { icon: Cpu,         color: 'text-blue-400',    bg: 'bg-blue-500/10',    title: 'AI Case Analysis',                desc: 'Automatically analyze case files using NLP to extract key facts, timelines, suspect profiles, and legal provisions with 98% accuracy.' },
  { icon: Archive,     color: 'text-purple-400',  bg: 'bg-purple-500/10',  title: 'Evidence Management',             desc: 'End-to-end digital chain of custody with tamper-proof logging, blockchain verification, and secure multi-user access control.' },
  { icon: Fingerprint, color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    title: 'Digital Forensics',               desc: 'Deep analysis of digital artifacts -- mobile devices, computers, USB drives, and cloud storage -- with court-admissible reporting.' },
  { icon: Camera,      color: 'text-orange-400',  bg: 'bg-orange-500/10',  title: 'Crime Scene Documentation',       desc: 'Structured digital documentation of crime scenes with geotagged photographs, sketches, measurements, and 3D reconstruction support.' },
  { icon: Users,       color: 'text-green-400',   bg: 'bg-green-500/10',   title: 'Suspect & Witness Management',    desc: 'Centralized profiles for suspects, witnesses, and victims with relationship mapping, statement recording, and interview scheduling.' },
  { icon: Shield,      color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  title: 'Chain of Custody Tracking',       desc: 'Real-time tracking of every piece of evidence from collection to courtroom with immutable audit trails and custody transfer logs.' },
  { icon: Clock,       color: 'text-pink-400',    bg: 'bg-pink-500/10',    title: 'Investigation Timeline',          desc: 'Visual, interactive timelines auto-generated from evidence, witness statements, and case events to reconstruct the sequence of incidents.' },
  { icon: Eye,         color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  title: 'Facial Recognition Integration', desc: 'Integration with CCTV feeds and suspect databases using AI facial recognition to identify persons of interest in real time.' },
  { icon: Car,         color: 'text-red-400',     bg: 'bg-red-500/10',     title: 'Vehicle & Plate Analysis',        desc: 'Automated license plate recognition and vehicle tracking across multiple checkpoints, integrated with RTO and traffic camera databases.' },
  { icon: Video,       color: 'text-teal-400',    bg: 'bg-teal-500/10',    title: 'CCTV & Video Analysis',           desc: 'AI-powered video evidence analysis for scene reconstruction, person tracking, and incident verification from surveillance footage.' },
  { icon: Phone,       color: 'text-violet-400',  bg: 'bg-violet-500/10',  title: 'CDR Analysis',                    desc: 'Call Detail Record analysis to map communication networks, identify co-conspirators, and reconstruct location trails of suspects.' },
  { icon: BookOpen,    color: 'text-amber-400',   bg: 'bg-amber-500/10',   title: 'Legal Document Management',       desc: 'Organize FIRs, affidavits, court orders, and legal notices with AI-assisted tagging, version control, and collaborative editing.' },
  { icon: Briefcase,   color: 'text-lime-400',    bg: 'bg-lime-500/10',    title: 'Court Case Preparation',          desc: 'Structured case bundles with auto-generated summaries, exhibit lists, witness schedules, and legal argument support for prosecutors.' },
  { icon: FileText,    color: 'text-sky-400',     bg: 'bg-sky-500/10',     title: 'Investigation Reports',           desc: 'One-click generation of professional investigation reports, charge sheets, and progress summaries in standardized government formats.' },
  { icon: Sparkles,    color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', title: 'AI Investigation Assistant',      desc: 'Conversational AI assistant trained on Indian Penal Code, CrPC, and forensic procedures to guide investigators at every step.' },
];

const CONTACT_INFO = [
  { icon: MapPin,    label: 'Head Office',       value: '14th Floor, Cyber Tower, Hitech City, Hyderabad, Telangana - 500081' },
  { icon: Mail,      label: 'General Enquiries', value: 'contact@justiceai.gov.in' },
  { icon: PhoneCall, label: 'Support Helpdesk',  value: '+91 40 6800 7000' },
  { icon: Globe,     label: 'Emergency Support', value: '24x7 support@justiceai.gov.in' },
  { icon: Clock,     label: 'Working Hours',     value: 'Mon to Fri, 09:00 to 18:00 IST' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection]   = useState('home');
  const [contactForm, setContactForm]        = useState({ name: '', email: '', org: '', subject: '', message: '' });
  const [contactErrors, setContactErrors]    = useState<Record<string, string>>({});
  const [contactSent, setContactSent]        = useState(false);

  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(11,18,32,0)', 'rgba(11,18,32,0.97)']);

  const scrollTo = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const ids = NAV_ITEMS.map((n) => n.href.replace('#', ''));
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const validateContact = () => {
    const errs: Record<string, string> = {};
    if (!contactForm.name.trim())    errs.name    = 'Name is required';
    if (!contactForm.email.trim())   errs.email   = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) errs.email = 'Enter a valid email';
    if (!contactForm.org.trim())     errs.org     = 'Organisation is required';
    if (!contactForm.subject.trim()) errs.subject = 'Subject is required';
    if (!contactForm.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateContact();
    if (Object.keys(errs).length) { setContactErrors(errs); return; }
    setContactErrors({});
    setContactSent(true);
  };

  const updateField = (field: string, value: string) => {
    setContactForm((p) => ({ ...p, [field]: value }));
    if (contactErrors[field]) setContactErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen bg-base-bg text-white overflow-x-hidden">

      {/* NAVIGATION */}
      <motion.header
        style={{ backgroundColor: headerBg as any }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-base-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

            <button onClick={() => scrollTo('#home')} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">JusticeAI</span>
                <p className="text-2xs text-slate-500 font-medium">Investigation Platform</p>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-8">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.href.replace('#', '');
                return (
                  <button
                    key={item.href}
                    onClick={() => scrollTo(item.href)}
                    className={`relative text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="activeNav"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-navy-500 to-navy-400 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Link to="/login" className="btn-primary btn-sm">
                Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden btn-icon">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 pb-4 space-y-1 border-t border-base-border pt-4"
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === item.href.replace('#', '')
                      ? 'bg-navy-500/10 text-white border border-navy-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-base-elevated'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-3 space-y-2 px-1">
                <Link to="/login" className="btn-primary w-full btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:8, repeat:Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl" />
        <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.2,0.4,0.2] }} transition={{ duration:10, repeat:Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center lg:text-left">
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-500/10 border border-navy-500/20 mb-8">
                <Sparkles className="w-4 h-4 text-navy-400" />
                <span className="text-sm font-semibold text-navy-400">Powered by Advanced AI</span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Helping Investigators.<br />
                <span className="text-gradient-navy">Supporting Justice.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
                AI-powered criminal investigation platform for police departments, forensic teams and legal professionals.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary btn-lg group">
                  Start Investigation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button onClick={() => scrollTo('#features')} className="btn-secondary btn-lg">
                  <Play className="w-5 h-5" /> Explore Features
                </button>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity:0, x:60 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.3 }} className="relative">
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Investigation Dashboard</h3>
                  <span className="badge-green text-2xs">Live</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass-card p-3"><p className="text-2xs text-slate-500 mb-1">Active Cases</p><p className="text-2xl font-bold text-white">247</p></div>
                  <div className="glass-card p-3"><p className="text-2xs text-slate-500 mb-1">AI Insights</p><p className="text-2xl font-bold text-navy-400">89</p></div>
                </div>
                <div className="h-24 bg-base-elevated rounded-xl flex items-end gap-1 p-2">
                  {[40,65,45,80,60,90,70,85,75,95].map((h,i) => (
                    <motion.div key={i} initial={{ height:0 }} animate={{ height:`${h}%` }} transition={{ delay:0.5+i*0.1 }}
                      className="flex-1 bg-gradient-to-t from-navy-600 to-navy-400 rounded-sm" />
                  ))}
                </div>
              </div>
              <motion.div animate={{ y:[0,-10,0] }} transition={{ duration:3, repeat:Infinity }} className="absolute -top-6 -right-6 glass-card p-4 w-48">
                <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-xs font-semibold text-white">Evidence Verified</span></div>
                <p className="text-2xs text-slate-500">Forensic analysis complete</p>
              </motion.div>
              <motion.div animate={{ y:[0,10,0] }} transition={{ duration:4, repeat:Infinity, delay:1 }} className="absolute -bottom-4 -left-4 glass-card p-4 w-44">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-navy-400" /><span className="text-xs font-semibold text-white">AI Recommendation</span></div>
                <p className="text-2xs text-slate-500">3 new leads identified</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Enterprise-grade tools designed specifically for modern law enforcement workflows</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText,    color:'text-blue-400',   bg:'bg-blue-500/10',   title:'AI FIR Analysis',             desc:'Automatically extract entities, dates, locations, and applicable IPC sections from FIR text using advanced NLP.' },
              { icon: Archive,     color:'text-purple-400', bg:'bg-purple-500/10', title:'Evidence Management',         desc:'Secure digital chain of custody with tamper-proof audit trails, multi-user access control, and court-ready exhibit bundles.' },
              { icon: Fingerprint, color:'text-cyan-400',   bg:'bg-cyan-500/10',   title:'Digital Forensics',           desc:'Advanced analysis of mobile devices, computers, and cloud artifacts with automated report generation for courtroom presentation.' },
              { icon: Clock,       color:'text-green-400',  bg:'bg-green-500/10',  title:'Timeline Reconstruction',     desc:'AI-powered automatic incident timeline built from evidence logs, witness statements, and CDR data.' },
              { icon: Scale,       color:'text-yellow-400', bg:'bg-yellow-500/10', title:'Legal Recommendation Engine', desc:'Intelligent suggestions for applicable IPC, CrPC, IT Act, and POCSO sections with relevant case law references.' },
              { icon: BarChart3,   color:'text-red-400',    bg:'bg-red-500/10',    title:'Case Analytics',              desc:'Real-time dashboards with case resolution rates, officer workload, crime hotspot maps, and AI-driven predictive insights.' },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeInUp} whileHover={{ y:-8, transition:{ duration:0.2 } }} className="feature-card group">
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-navy-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW TIMELINE */}
      <section className="py-32 bg-gradient-to-b from-transparent via-base-surface/50 to-transparent">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-4">Investigation Workflow</h2>
            <p className="text-lg text-slate-400">End-to-end case management powered by AI</p>
          </motion.div>
          <div className="space-y-12">
            {[
              { icon: Archive,   title:'Collect Evidence', desc:'Digitally log every piece of physical and digital evidence at the scene with geotagging, photos, and automated chain of custody initiation.' },
              { icon: FileText,  title:'Analyze FIR',      desc:'AI extracts suspects, victims, witnesses, dates, locations, and applicable legal sections from the FIR in seconds.' },
              { icon: Users,     title:'Track Suspects',   desc:'Build comprehensive profiles with photos, CDR data, known associates, prior records, and movement history.' },
              { icon: BarChart3, title:'Generate Reports', desc:'Auto-generate investigation progress reports, forensic lab reports, and court submission summaries with one click.' },
              { icon: Scale,     title:'File Chargesheet', desc:'AI pre-populates chargesheets with verified evidence references, witness lists, and legally validated IPC sections.' },
            ].map((step, i) => (
              <motion.div key={step.title} initial={{ opacity:0, x:-40 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.2 }} className="timeline-item">
                <div className="timeline-dot bg-navy-500" />
                <div className="timeline-content">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-500/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-6 h-6 text-navy-400" />
                    </div>
                    <div><h3 className="text-lg font-bold text-white mb-2">{step.title}</h3><p className="text-sm text-slate-400">{step.desc}</p></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value:'120K+', label:'Cases Processed', icon:FileText  },
              { value:'98%',   label:'AI Accuracy',     icon:Zap       },
              { value:'15K+',  label:'Police Officers', icon:Users     },
              { value:'300+',  label:'Departments',     icon:Building2 },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp} className="text-center glass-panel p-8 group hover:border-navy-500/30 transition-all">
                <stat.icon className="w-8 h-8 text-navy-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <p className="metric-xl text-gradient-navy mb-2">{stat.value}</p>
                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section id="solutions" className="py-32 bg-gradient-to-b from-transparent via-base-surface/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-500/10 border border-navy-500/20 mb-6">
              <Target className="w-4 h-4 text-navy-400" />
              <span className="text-sm font-semibold text-navy-400">Complete Investigation Suite</span>
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">End-to-End Solutions</h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              From the moment a crime is reported to the final chargesheet filing, JusticeAI covers every step of the investigation lifecycle with AI-powered precision.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SOLUTIONS.map((s) => (
              <motion.div key={s.title} variants={fadeInUp} whileHover={{ y:-6, transition:{ duration:0.2 } }}
                className="glass-card-hover p-6 group relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))' }} />
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-navy-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by Professionals</h2>
            <p className="text-lg text-slate-400">Hear from the officers and prosecutors using JusticeAI every day</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid md:grid-cols-3 gap-8">
            {[
              { quote:'JusticeAI reduced our case filing time by 70%. The AI FIR analysis is incredibly accurate -- it extracted every section correctly and flagged two IPC sections our team had missed.',     name:'Inspector Rajesh Kumar', role:'Senior Police Officer',      dept:'Mumbai Crime Branch' },
              { quote:'The legal recommendation engine is a game-changer for prosecutors. It surfaces precedents I would have spent days researching, and the chargesheet builder saves enormous time.',          name:'Adv. Priya Sharma',     role:'Special Public Prosecutor', dept:'Delhi High Court' },
              { quote:'We cracked three major cyber fraud cases using the CDR analysis and digital forensics modules. The chain of custody tracking makes our evidence unimpeachable in court.',                  name:'SI Arjun Mehta',         role:'Cyber Crime Investigator',  dept:'Bengaluru Cyber Cell' },
            ].map((t) => (
              <motion.div key={t.name} variants={fadeInUp} className="glass-panel p-8 relative flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <Quote className="w-8 h-8 text-navy-500/20 mb-3" />
                <p className="text-slate-300 leading-relaxed mb-6 italic flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-600 to-navy-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                    <p className="text-2xs text-slate-600">{t.dept}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-32 bg-gradient-to-b from-transparent via-base-surface/40 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-500/10 border border-navy-500/20 mb-6">
              <Award className="w-4 h-4 text-navy-400" />
              <span className="text-sm font-semibold text-navy-400">About JusticeAI</span>
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">Built for Those Who Protect Justice</h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              JusticeAI was founded by a coalition of former IPS officers, forensic scientists, and AI researchers who experienced firsthand how outdated investigation tools slowed justice delivery across India.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="glass-panel p-8">
              <div className="w-14 h-14 rounded-2xl bg-navy-500/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-navy-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-slate-400 leading-relaxed">
                To empower investigators, forensic experts, and legal professionals with AI-driven tools that eliminate administrative bottlenecks, reduce case pendency, and ensure that no guilty person escapes justice due to procedural gaps or evidence mismanagement.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="glass-panel p-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
              <p className="text-slate-400 leading-relaxed">
                A future where every police station in India operates with the investigative capability of elite forensic units -- where AI handles the paperwork so officers can focus on fieldwork, and where every victim receives timely justice backed by irrefutable evidence.
              </p>
            </motion.div>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="glass-card p-10 mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Why JusticeAI Exists</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  India's criminal justice system manages over <span className="text-white font-semibold">50 million pending cases</span> -- a backlog driven largely by slow, paper-based investigation processes, evidence mishandling, and lack of forensic expertise at the ground level.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  JusticeAI bridges this gap by automating routine tasks -- FIR drafting, legal section mapping, evidence logging, and report generation -- freeing investigators to focus on what matters: finding the truth.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  'Reduces FIR filing time from hours to minutes',
                  'Eliminates evidence tampering with blockchain custody',
                  'Surfaces relevant case law in real time',
                  'Standardizes investigation quality across all stations',
                  'Enables remote collaboration between agencies',
                  'Produces court-admissible digital evidence packages',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Shield,      color:'text-blue-400',   bg:'bg-blue-500/10',   title:'Law Enforcement',       users:'Police Officers, IB, CBI, NIA, State ATS',         benefits:['Real-time case dashboards','AI-assisted FIR analysis','Suspect tracking & profiling','Integrated evidence vault'] },
              { icon: Fingerprint, color:'text-purple-400', bg:'bg-purple-500/10', title:'Forensic Laboratories', users:'FSL, CFSL, Private Forensic Labs',                   benefits:['Digital evidence intake','Chain of custody automation','Lab report generation','Cross-agency data sharing'] },
              { icon: Scale,       color:'text-yellow-400', bg:'bg-yellow-500/10', title:'Legal & Prosecution',   users:'Public Prosecutors, Advocates, Judiciary',           benefits:['Case bundle preparation','Legal section recommendations','Court timeline builder','Witness management'] },
            ].map((card) => (
              <motion.div key={card.title} variants={fadeInUp} className="glass-card-hover p-6">
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                <p className="text-xs text-slate-500 mb-4">{card.users}</p>
                <ul className="space-y-2">
                  {card.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
                      <ChevronRight className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value:'120K+', label:'Cases Processed' },
              { value:'98%',   label:'AI Accuracy'     },
              { value:'15K+',  label:'Active Officers' },
              { value:'300+',  label:'Departments'     },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeInUp} className="glass-panel p-6 text-center">
                <p className="text-4xl font-bold text-gradient-navy mb-2 tabular-nums">{s.value}</p>
                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeInUp} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-500/10 border border-navy-500/20 mb-6">
              <Mail className="w-4 h-4 text-navy-400" />
              <span className="text-sm font-semibold text-navy-400">Get in Touch</span>
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Request a live demonstration, ask about enterprise deployment, or speak with our team about your department's investigation needs.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">

            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="lg:col-span-2 space-y-4">
              {CONTACT_INFO.map((c) => (
                <motion.div key={c.label} variants={fadeInUp} className="glass-card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-navy-500/10 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-navy-400" />
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-widest text-slate-500 mb-1">{c.label}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.value}</p>
                  </div>
                </motion.div>
              ))}
              <motion.div variants={fadeInUp} className="glass-card p-4 rounded-2xl overflow-hidden">
                <div className="h-40 bg-base-elevated rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-30" />
                  <div className="relative z-10 text-center">
                    <MapPin className="w-8 h-8 text-navy-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">Hyderabad, Telangana</p>
                    <p className="text-2xs text-slate-500">Cyber Tower, Hitech City</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:40 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="lg:col-span-3">
              <div className="glass-panel p-8">
                <h3 className="text-xl font-bold text-white mb-6">Send us a Message</h3>

                {contactSent ? (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Message Sent!</h4>
                    <p className="text-slate-400 mb-6">Thank you for reaching out. Our team will respond within one business day.</p>
                    <button onClick={() => { setContactSent(false); setContactForm({ name:'', email:'', org:'', subject:'', message:'' }); }} className="btn-secondary">
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Full Name *</label>
                        <input value={contactForm.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Inspector R. Kumar" className={`input ${contactErrors.name ? 'input-error' : ''}`} />
                        {contactErrors.name && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{contactErrors.name}</p>}
                      </div>
                      <div>
                        <label className="input-label">Email Address *</label>
                        <input type="email" value={contactForm.email} onChange={(e) => updateField('email', e.target.value)} placeholder="officer@police.gov.in" className={`input ${contactErrors.email ? 'input-error' : ''}`} />
                        {contactErrors.email && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{contactErrors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Organisation / Department *</label>
                      <input value={contactForm.org} onChange={(e) => updateField('org', e.target.value)} placeholder="e.g. Maharashtra State Police, CBI, CFSL" className={`input ${contactErrors.org ? 'input-error' : ''}`} />
                      {contactErrors.org && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{contactErrors.org}</p>}
                    </div>
                    <div>
                      <label className="input-label">Subject *</label>
                      <select value={contactForm.subject} onChange={(e) => updateField('subject', e.target.value)} className={`input ${contactErrors.subject ? 'input-error' : ''}`}>
                        <option value="">Select a subject</option>
                        <option>Request Live Demonstration</option>
                        <option>Enterprise Licensing and Pricing</option>
                        <option>Technical Support</option>
                        <option>Integration and API Enquiry</option>
                        <option>Training and Onboarding</option>
                        <option>Media and Press Enquiry</option>
                        <option>Other</option>
                      </select>
                      {contactErrors.subject && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{contactErrors.subject}</p>}
                    </div>
                    <div>
                      <label className="input-label">Message *</label>
                      <textarea rows={5} value={contactForm.message} onChange={(e) => updateField('message', e.target.value)} placeholder="Describe your department's requirements or questions in detail..." className={`input resize-none ${contactErrors.message ? 'input-error' : ''}`} />
                      {contactErrors.message && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{contactErrors.message}</p>}
                    </div>
                    <button type="submit" className="btn-primary w-full btn-lg group">
                      <Send className="w-5 h-5" />
                      Send Message
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-xs text-slate-600 text-center">
                      By submitting, you agree to our Privacy Policy. Your data is handled per IT Act 2000 and DPDP Act 2023.
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-base-border bg-base-surface/50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-white">JusticeAI</span>
                  <p className="text-2xs text-slate-500">Investigation Platform</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-6">
                India's most advanced AI-powered criminal investigation and legal decision support platform -- trusted by police departments, forensic labs, and prosecutors across 300+ agencies.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="badge-green text-2xs">SOC 2 Type II</span>
                <span className="badge-blue text-2xs">ISO 27001</span>
                <span className="badge-purple text-2xs">CERT-In Compliant</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Platform</h3>
              <ul className="space-y-2">
                {[
                  { label:'Features',  href:'#features'  },
                  { label:'Solutions', href:'#solutions' },
                  { label:'About',     href:'#about'     },
                  { label:'Contact',   href:'#contact'   },
                ].map((link) => (
                  <li key={link.label}>
                    <button onClick={() => scrollTo(link.href)} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Legal</h3>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Security', 'DPDP Compliance', 'RTI Disclosure'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-base-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              &copy; 2024 JusticeAI Technologies Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-xs text-slate-700">
              For authorised law enforcement and legal personnel only. All access is logged and monitored.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
