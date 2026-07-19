import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import api from '../../lib/api';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

interface Notification {
  id: string;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthStore();
  const searchRef = useRef<HTMLInputElement>(null);

  // Real-time notifications via Socket.io
  useRealtimeNotifications(() => {
    // Refresh unread count on any real-time notification
    api.get('/notifications', { params: { unread: true, limit: 5 } })
      .then((r) => {
        const data = r.data as Notification[];
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      })
      .catch(() => {});
  });
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Ctrl+K global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Load notifications count
  useEffect(() => {
    api.get('/notifications?unread=true').then((res) => {
      const data = res.data as Notification[];
      setNotifications(data.slice(0, 5));
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }).catch(() => {});
  }, []);

  // Close notif on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getNotifIcon = (type: string) => {
    const map: Record<string, string> = {
      case_update: '🔵', evidence_uploaded: '📎', system: '⚙️', alert: '🔴',
    };
    return map[type] || '📋';
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="flex h-screen bg-[#0B1220] overflow-hidden">

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Navbar ────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 h-14 flex items-center gap-3 px-4 sm:px-6
                           bg-[#0F172A]/80 backdrop-blur-md border-b border-[#1E293B] z-30">

          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-icon lg:hidden flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-bold text-xs">J</span>
            </div>
            <span className="text-sm font-bold text-white">JusticeAI</span>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-xl mx-auto hidden sm:block">
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
              className="w-full flex items-center gap-3 px-3 py-2 bg-[#1A2332] border border-[#1E293B]
                         rounded-xl text-sm text-slate-500 hover:border-primary-500/30
                         hover:bg-[#1E293B] transition-all duration-200 group"
            >
              <Search className="w-4 h-4 group-hover:text-primary-400 transition-colors" />
              <span className="flex-1 text-left truncate">Search cases, FIRs, persons, evidence...</span>
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-[#0F172A] border border-[#334155]
                              rounded-lg text-xs text-slate-600 font-mono">
                Ctrl K
              </kbd>
            </button>
          </div>
          {/* Mobile search icon only */}
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className="btn-icon sm:hidden"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Date */}
            <span className="hidden md:block text-xs text-slate-500 font-medium">{dateStr}</span>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative btn-icon"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500
                                   rounded-full text-[9px] font-bold text-white flex items-center
                                   justify-center ring-2 ring-[#0F172A]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 card shadow-card z-50 overflow-hidden"
                  >
                    <div className="card-header flex items-center justify-between py-3">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-[#1E293B] max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 flex items-start gap-3 hover:bg-[#1A2332] cursor-pointer transition-colors ${!n.is_read ? 'bg-primary-500/5' : ''}`}
                          >
                            <span className="text-base flex-shrink-0 mt-0.5">{getNotifIcon(n.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                              {n.message && <p className="text-xs text-slate-500 truncate mt-0.5">{n.message}</p>}
                            </div>
                            <span className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo(n.created_at)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-3 border-t border-[#1E293B]">
                      <button
                        onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                        className="text-xs text-primary-400 hover:text-primary-300 w-full text-center"
                      >
                        View all notifications →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                         hover:bg-[#1E293B] transition-colors duration-200"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800
                              flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-none">
                  {user?.full_name?.split(' ')[0]}
                </p>
                <p className="text-[10px] text-slate-500 leading-none mt-0.5 capitalize">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block" />
            </button>
          </div>
        </header>

        {/* ── Global Search Modal ───────────────────────────────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                onClick={() => setSearchOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
              >
                <div className="card shadow-glow overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E293B]">
                    <Search className="w-5 h-5 text-primary-400" />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cases, FIRs, persons, evidence..."
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          navigate(`/cases?search=${encodeURIComponent(searchQuery)}`);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                    />
                    <kbd className="px-2 py-1 bg-[#1A2332] border border-[#334155] rounded-lg
                                    text-xs text-slate-500 font-mono">ESC</kbd>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Quick Actions</p>
                    <div className="space-y-1">
                      {[
                        { label: 'New Case', path: '/cases/new', icon: '📁' },
                        { label: 'Smart Case Filing', path: '/case-filing', icon: '⚖️' },
                        { label: 'FIR Analyzer', path: '/fir-analyzer', icon: '🔍' },
                        { label: 'AI Assistant', path: '/ai-chat', icon: '🤖' },
                      ].map((item) => (
                        <button
                          key={item.path}
                          onClick={() => { navigate(item.path); setSearchOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                     text-sm text-slate-300 hover:bg-[#1E293B] hover:text-white
                                     transition-colors text-left"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Page Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
