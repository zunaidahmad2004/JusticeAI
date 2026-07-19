import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Search, Bell, ChevronDown, User, LogOut, Settings,
  Shield, Plus, FolderOpen, Bot, LayoutDashboard, ClipboardList,
  Zap, Activity, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import api from '../../lib/api';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import toast from 'react-hot-toast';

interface Notification {
  id: string; title: string; message?: string;
  is_read: boolean; created_at: string; type: string;
}

const QUICK_LINKS = [
  { name: 'Dashboard',        path: '/dashboard',    icon: LayoutDashboard, cat: 'Pages'    },
  { name: 'Cases',            path: '/cases',         icon: FolderOpen,     cat: 'Pages'    },
  { name: 'Smart FIR Filing', path: '/case-filing',   icon: Zap,            cat: 'Tools'    },
  { name: 'FIR Analyzer',     path: '/fir-analyzer',  icon: Activity,       cat: 'Tools'    },
  { name: 'AI Assistant',     path: '/ai-chat',       icon: Bot,            cat: 'AI'       },
  { name: 'Reports',          path: '/reports',       icon: ClipboardList,  cat: 'Tools'    },
];

export default function AppLayout() {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem('sidebar_collapsed') === 'true'
  );
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const profileRef= useRef<HTMLDivElement>(null);

  useRealtimeNotifications(() => { fetchNotifs(); });

  const fetchNotifs = async () => {
    try {
      const r = await api.get('/notifications');
      const d = r.data as Notification[];
      setNotifications(d.slice(0, 10));
      setUnreadCount(d.filter(n => !n.is_read).length);
    } catch {}
  };

  useEffect(() => { fetchNotifs(); }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  useEffect(() => {
    const oc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current   && !notifRef.current.contains(t))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', oc);
    return () => document.removeEventListener('mousedown', oc);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    const main = document.getElementById('main-scroll');
    main?.addEventListener('scroll', onScroll);
    return () => main?.removeEventListener('scroll', onScroll);
  }, []);

  const toggleCollapse = () => {
    const v = !sidebarCollapsed;
    setSidebarCollapsed(v);
    localStorage.setItem('sidebar_collapsed', String(v));
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications cleared');
    } catch { toast.error('Failed'); }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  const timeAgo = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const notifColor = (t: string) => ({
    case_update:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
    evidence_uploaded: 'bg-green-500/10 text-green-400 border-green-500/20',
    system:            'bg-slate-500/10 text-slate-400 border-slate-500/20',
    alert:             'bg-red-500/10 text-red-400 border-red-500/20',
  }[t] || 'bg-primary-500/10 text-primary-400 border-primary-500/20');

  const filtered = QUICK_LINKS.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-bg text-slate-100 font-sans">
      {/* Background ambience */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      <motion.div animate={{ scale:[1,1.15,1], opacity:[0.04,0.08,0.04] }} transition={{ duration:12, repeat:Infinity, ease:'easeInOut' }}
        className="absolute top-[-10%] right-[15%] w-[600px] h-[600px] rounded-full bg-primary-600/10 blur-3xl pointer-events-none" />
      <motion.div animate={{ scale:[1.1,1,1.1], opacity:[0.03,0.06,0.03] }} transition={{ duration:16, repeat:Infinity, ease:'easeInOut' }}
        className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-neon-cyan/5 blur-3xl pointer-events-none" />

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 relative z-30">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:0.6 }} exit={{ opacity:0 }}
              onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black z-40 md:hidden" />
            <motion.div initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', damping:28, stiffness:220 }}
              className="fixed top-0 bottom-0 left-0 w-72 z-50 md:hidden">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* ── TOP NAVBAR ── */}
        <motion.header
          animate={{ boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.6)' : '0 1px 0 rgba(255,255,255,0.02)' }}
          className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-[60px] transition-colors duration-300"
          style={{ background: scrolled ? 'rgba(6,10,20,0.88)' : 'rgba(6,10,20,0.6)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden btn-icon w-8 h-8">
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-2xs font-bold text-slate-600 uppercase tracking-widest">System Online</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <Shield className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-bold text-white">JusticeAI</span>
            </div>
          </div>

          {/* Center – search */}
          <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md mx-4">
            <button onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-slate-500 transition-all duration-200 group hover:border-primary-500/30"
              style={{ background:'rgba(16,21,30,0.6)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'inset 0 1px 4px rgba(0,0,0,0.3)' }}
            >
              <Search className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors flex-shrink-0" />
              <span className="flex-1 text-left">Search anything...</span>
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono text-slate-700"
                style={{ background:'rgba(22,28,40,0.8)', border:'1px solid rgba(255,255,255,0.05)' }}>⌘K</kbd>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Notif bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)} className="btn-icon w-8 h-8 relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity:0, y:8, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8, scale:0.96 }} transition={{ duration:0.18 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel overflow-hidden flex flex-col max-h-[440px] z-50"
                    style={{ boxShadow:'0 24px 64px rgba(0,0,0,0.7)' }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:'rgba(255,255,255,0.05)', background:'rgba(16,21,30,0.8)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Notifications</span>
                        {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">{unreadCount}</span>}
                      </div>
                      <button onClick={markAllRead} className="text-[11px] text-primary-400 hover:text-primary-300 font-semibold transition-colors">Clear all</button>
                    </div>
                    <div className="flex-1 overflow-y-auto scroll-area divide-y" style={{ divideColor:'rgba(255,255,255,0.03)' }}>
                      {notifications.length === 0
                        ? <div className="py-10 text-center text-slate-500 text-xs">No notifications</div>
                        : notifications.map(n => (
                          <div key={n.id} className={`p-4 transition-colors hover:bg-white/[0.02] ${!n.is_read ? 'bg-primary-500/[0.03]' : ''}`}>
                            <div className="flex items-start gap-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${notifColor(n.type)}`}>{n.type.replace('_',' ')}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate">{n.title}</p>
                                {n.message && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate-2">{n.message}</p>}
                                <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    <div className="px-4 py-2.5 border-t text-center" style={{ borderColor:'rgba(255,255,255,0.04)', background:'rgba(16,21,30,0.6)' }}>
                      <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                        View all notifications →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl transition-all duration-200 hover:bg-white/[0.04]"
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-glow-sm"
                  style={{ background:'linear-gradient(135deg, #4F46E5, #6366F1, #818CF8)' }}>
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity:0, y:8, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8, scale:0.96 }} transition={{ duration:0.15 }}
                    className="absolute right-0 mt-2 w-52 glass-panel overflow-hidden z-50" style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
                      <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 capitalize truncate">{user?.role?.replace(/_/g,' ')}</p>
                    </div>
                    <div className="p-2 space-y-0.5">
                      {[
                        { icon: User,     label:'Profile',  action:() => { setProfileOpen(false); navigate('/profile'); } },
                        { icon: Settings, label:'Settings', action:() => { setProfileOpen(false); navigate('/profile'); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors">
                          <item.icon className="w-3.5 h-3.5 text-slate-500" />{item.label}
                        </button>
                      ))}
                      <div className="my-1 border-t" style={{ borderColor:'rgba(255,255,255,0.04)' }} />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main id="main-scroll" className="flex-1 overflow-y-auto scroll-area px-3 sm:px-5 md:px-6 py-5 pb-24 md:pb-6 relative">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center h-16 px-2"
          style={{ background:'rgba(6,10,20,0.92)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {[
            { to:'/dashboard', icon:LayoutDashboard, label:'Home' },
            { to:'/cases',     icon:FolderOpen,      label:'Cases' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${location.pathname === item.to ? 'text-primary-400' : 'text-slate-500'}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </Link>
          ))}
          <div className="relative -top-4">
            <motion.button whileTap={{ scale:0.93 }} onClick={() => navigate('/cases/new')}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{ background:'linear-gradient(135deg, #4F46E5, #6366F1)', boxShadow:'0 0 20px rgba(99,102,241,0.5)' }}>
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>
          {[
            { to:'/ai-chat', icon:Bot,      label:'AI' },
            { to:'/profile', icon:Settings, label:'More' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${location.pathname === item.to ? 'text-primary-400' : 'text-slate-500'}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Global command palette */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:0.7 }} exit={{ opacity:0 }}
              onClick={() => setSearchOpen(false)} className="fixed inset-0 bg-black z-50" style={{ backdropFilter:'blur(4px)' }} />
            <motion.div initial={{ opacity:0, scale:0.96, y:'-8%' }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.96, y:'-8%' }}
              transition={{ type:'spring', duration:0.3 }}
              className="fixed inset-x-4 top-20 max-w-xl mx-auto z-50 glass-panel overflow-hidden"
              style={{ boxShadow:'0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)' }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <Search className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <input ref={searchRef} type="text" placeholder="Search pages, tools, features..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} autoFocus
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none" />
                <button onClick={() => setSearchOpen(false)}
                  className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                  style={{ background:'rgba(22,28,40,0.8)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto scroll-area">
                {filtered.length === 0
                  ? <p className="text-xs text-slate-600 text-center py-8">No results found</p>
                  : filtered.map(item => (
                    <button key={item.path} onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate(item.path); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-primary-500/10 hover:border-primary-500/20 border border-transparent transition-all text-left">
                      <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3.5 h-3.5 text-primary-400" />
                      </div>
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-500"
                        style={{ background:'rgba(22,28,40,0.8)', border:'1px solid rgba(255,255,255,0.05)' }}>{item.cat}</span>
                    </button>
                  ))
                }
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
