import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FolderOpen, Microscope, Archive, Bot,
  BarChart3, Bell, Settings, ScrollText, ChevronRight, ChevronLeft,
  Shield, LogOut, Scale, ShieldAlert, Calendar, Share2,
  Users, Heart, Fingerprint, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface NavItem { to: string; icon: React.ElementType; label: string; badge?: string; }

const mainNav: NavItem[] = [
  { to:'/dashboard',    icon:LayoutDashboard, label:'Dashboard'  },
  { to:'/cases',        icon:FolderOpen,      label:'Cases'      },
  { to:'/evidence',     icon:Archive,         label:'Evidence'   },
  { to:'/suspects',     icon:Fingerprint,     label:'Suspects'   },
  { to:'/witnesses',    icon:Users,           label:'Witnesses'  },
  { to:'/victims',      icon:Heart,           label:'Victims'    },
];
const firNav: NavItem[] = [
  { to:'/case-filing',  icon:Scale,      label:'Smart FIR Filing' },
  { to:'/fir-analyzer', icon:Microscope, label:'FIR Analyzer'     },
];
const legalNav: NavItem[] = [
  { to:'/legal',          icon:Scale,       label:'Legal Provisions' },
  { to:'/risk-analysis',  icon:ShieldAlert, label:'Risk Analysis'    },
  { to:'/graph',          icon:Share2,      label:'Crime Graph'      },
  { to:'/court-calendar', icon:Calendar,    label:'Court Calendar'   },
];
const aiNav: NavItem[] = [
  { to:'/ai-chat',   icon:Bot,          label:'AI Assistant', badge:'AI' },
  { to:'/reports',   icon:ClipboardList,label:'Reports'      },
  { to:'/analytics', icon:BarChart3,    label:'Analytics'    },
];
const systemNav: NavItem[] = [
  { to:'/notifications', icon:Bell,       label:'Notifications' },
  { to:'/profile',       icon:Settings,   label:'Settings'      },
  { to:'/admin',         icon:ScrollText, label:'Audit Logs'    },
];

interface Props { collapsed?: boolean; onToggleCollapse?: () => void; onClose?: () => void; }

export default function Sidebar({ collapsed = false, onToggleCollapse, onClose }: Props) {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAdmin   = user && ['admin','super_admin'].includes(user.role);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  const NavItemComp = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.to ||
      (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

    return (
      <NavLink to={item.to} onClick={onClose}
        className={clsx(
          'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 select-none cursor-pointer group',
          collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'px-3 py-2.5',
          isActive ? 'text-white' : 'text-slate-500 hover:text-slate-200',
        )}
      >
        {/* Active bg */}
        {isActive && (
          <motion.div layoutId="sidebarActive" transition={{ type:'spring', bounce:0.1, duration:0.4 }}
            className="absolute inset-0 rounded-xl z-0"
            style={{ background:'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(99,102,241,0.12))', border:'1px solid rgba(99,102,241,0.25)', boxShadow:'0 0 20px rgba(99,102,241,0.1)' }}
          />
        )}

        {/* Hover bg */}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-0"
            style={{ background:'rgba(22,28,40,0.5)', border:'1px solid rgba(255,255,255,0.04)' }} />
        )}

        <item.icon className={clsx(
          'w-4 h-4 relative z-10 flex-shrink-0 transition-all duration-200',
          isActive ? 'text-primary-400' : 'text-slate-600 group-hover:text-slate-300 group-hover:scale-110',
        )} />

        {!collapsed && (
          <span className="relative z-10 flex-1 truncate">{item.label}</span>
        )}

        {!collapsed && item.badge && (
          <span className="relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-primary-400 bg-primary-500/10 border border-primary-500/20">
            {item.badge}
          </span>
        )}

        {/* Collapsed tooltip */}
        {collapsed && (
          <div className="absolute left-14 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0"
            style={{ background:'rgba(12,16,24,0.95)', border:'1px solid rgba(99,102,241,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.6)', borderRadius:'10px', padding:'6px 12px', whiteSpace:'nowrap' }}>
            <span className="text-xs font-semibold text-white">{item.label}</span>
            {item.badge && <span className="ml-1.5 text-[9px] text-primary-400">• {item.badge}</span>}
          </div>
        )}
      </NavLink>
    );
  };

  const sections = [
    { label:'Investigation', items:mainNav },
    { label:'FIR & Filing',  items:firNav  },
    { label:'Legal',         items:legalNav },
    { label:'AI & Reports',  items:aiNav   },
    { label:'System',        items:systemNav.filter(i => i.to !== '/admin' || isAdmin) },
  ];

  return (
    <motion.div animate={{ width: collapsed ? 68 : 240 }} transition={{ type:'spring', damping:22, stiffness:140 }}
      className="flex flex-col h-full relative z-30 flex-shrink-0"
      style={{ background:'rgba(8,12,20,0.95)', borderRight:'1px solid rgba(255,255,255,0.05)', boxShadow:'1px 0 0 rgba(255,255,255,0.02)' }}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 border-b flex-shrink-0 h-[60px]', collapsed ? 'justify-center px-0' : 'px-4')}
        style={{ borderColor:'rgba(255,255,255,0.05)' }}>
        <motion.div onClick={() => navigate('/dashboard')} whileTap={{ scale:0.93 }} whileHover={{ scale:1.05 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0 shadow-glow-sm"
          style={{ background:'linear-gradient(135deg, #4F46E5, #6366F1, #818CF8)' }}>
          <Shield className="w-4 h-4 text-white" />
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}
              className="cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
              <p className="text-sm font-bold text-white leading-none">JusticeAI</p>
              <p className="text-[10px] text-slate-600 font-medium mt-0.5">Investigation Suite</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-area py-4 space-y-5" style={{ padding: collapsed ? '16px 10px' : '16px 10px' }}>
        {sections.map(sec => (
          <div key={sec.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="section-label px-1 mb-1.5">{sec.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {sec.items.map(item => <NavItemComp key={item.to} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <button onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-[76px] w-6 h-6 rounded-full items-center justify-center text-slate-400 hover:text-white z-50 transition-all hover:scale-110"
          style={{ background:'rgba(12,16,24,0.95)', border:'1px solid rgba(99,102,241,0.2)', boxShadow:'0 0 12px rgba(99,102,241,0.15)' }}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}

      {/* User footer */}
      <div className="border-t flex-shrink-0 p-2" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
        <div className={clsx('flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-all', collapsed && 'justify-center p-0 w-10 h-10 mx-auto')}
          style={{ transition:'background 0.2s' }}
          onClick={() => { navigate('/profile'); onClose?.(); }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(22,28,40,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-glow-sm"
            style={{ background:'linear-gradient(135deg, #4F46E5, #818CF8)' }}>
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none">{user?.full_name}</p>
                <p className="text-[10px] text-slate-600 truncate mt-0.5 capitalize">{user?.role?.replace(/_/g,' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <button onClick={e => { e.stopPropagation(); handleLogout(); }}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 bg-transparent border-none">
              <LogOut className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
