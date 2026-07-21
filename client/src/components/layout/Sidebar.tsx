import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FolderOpen, Microscope, Archive, Bot,
  BarChart3, Bell, Settings, ScrollText, ChevronRight, ChevronLeft,
  Shield, LogOut, Scale, ShieldAlert, Calendar, Share2,
  Users, Heart, Fingerprint, ClipboardList, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface NavItem { to: string; icon: React.ElementType; label: string; badge?: string; color?: string; }

const mainNav: NavItem[] = [
  { to:'/dashboard',    icon:LayoutDashboard, label:'Dashboard',   color:'text-primary-400' },
  { to:'/cases',        icon:FolderOpen,      label:'Cases',       color:'text-blue-400'    },
  { to:'/evidence',     icon:Archive,         label:'Evidence',    color:'text-purple-400'  },
  { to:'/suspects',     icon:Fingerprint,     label:'Suspects',    color:'text-red-400'     },
  { to:'/witnesses',    icon:Users,           label:'Witnesses',   color:'text-cyan-400'    },
  { to:'/victims',      icon:Heart,           label:'Victims',     color:'text-pink-400'    },
];
const firNav: NavItem[] = [
  { to:'/case-filing',  icon:Zap,        label:'Smart FIR Filing', color:'text-yellow-400', badge:'AI' },
  { to:'/fir-analyzer', icon:Microscope, label:'FIR Analyzer',     color:'text-orange-400', badge:'AI' },
];
const legalNav: NavItem[] = [
  { to:'/legal',          icon:Scale,       label:'Legal Provisions', color:'text-indigo-400' },
  { to:'/risk-analysis',  icon:ShieldAlert, label:'Risk Analysis',    color:'text-red-400'    },
  { to:'/graph',          icon:Share2,      label:'Crime Graph',      color:'text-cyan-400'   },
  { to:'/court-calendar', icon:Calendar,    label:'Court Calendar',   color:'text-green-400'  },
];
const aiNav: NavItem[] = [
  { to:'/ai-chat',   icon:Bot,          label:'AI Assistant', color:'text-primary-400', badge:'AI' },
  { to:'/reports',   icon:ClipboardList,label:'Reports',      color:'text-blue-400'    },
  { to:'/analytics', icon:BarChart3,    label:'Analytics',    color:'text-green-400'   },
];
const systemNav: NavItem[] = [
  { to:'/notifications', icon:Bell,       label:'Notifications', color:'text-yellow-400' },
  { to:'/profile',       icon:Settings,   label:'Settings',      color:'text-slate-400'  },
  { to:'/admin',         icon:ScrollText, label:'Audit Logs',    color:'text-slate-400'  },
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
          'relative group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none',
          collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'px-3 py-2.5',
          isActive ? 'text-white' : 'text-slate-500 hover:text-slate-200',
        )}
      >
        {/* Active background */}
        {isActive && (
          <motion.div layoutId="sidebarActive"
            transition={{ type:'spring', bounce:0.1, duration:0.35 }}
            className="absolute inset-0 rounded-xl z-0"
            style={{ background:'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(91,140,255,0.1))', border:'1px solid rgba(124,92,255,0.3)', boxShadow:'0 0 20px rgba(124,92,255,0.08)' }}
          />
        )}
        {/* Hover background */}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-0"
            style={{ background:'rgba(40,46,58,0.5)', border:'1px solid rgba(255,255,255,0.04)' }} />
        )}

        <item.icon className={clsx(
          'relative z-10 flex-shrink-0 transition-all duration-200',
          collapsed ? 'w-5 h-5' : 'w-4 h-4',
          isActive ? (item.color || 'text-primary-400') : `text-slate-600 group-hover:${item.color || 'text-slate-300'} group-hover:scale-110`,
        )} />

        {!collapsed && (
          <span className="relative z-10 flex-1 truncate">{item.label}</span>
        )}

        {!collapsed && item.badge && (
          <span className="relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background:'rgba(124,92,255,0.15)', color:'#A78BFA', border:'1px solid rgba(124,92,255,0.25)' }}>
            {item.badge}
          </span>
        )}

        {/* Collapsed tooltip */}
        {collapsed && (
          <div className="absolute left-14 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150"
            style={{ background:'rgba(17,24,39,0.97)', border:'1px solid rgba(124,92,255,0.25)', boxShadow:'0 8px 32px rgba(0,0,0,0.7)', borderRadius:'10px', padding:'6px 12px', whiteSpace:'nowrap' }}>
            <span className="text-xs font-semibold text-white">{item.label}</span>
            {item.badge && <span className="ml-1.5 text-[9px] text-primary-400">• AI</span>}
          </div>
        )}
      </NavLink>
    );
  };

  const sections = [
    { label:'Investigation', items:mainNav              },
    { label:'FIR & Filing',  items:firNav               },
    { label:'Legal',         items:legalNav             },
    { label:'AI & Reports',  items:aiNav                },
    { label:'System',        items:systemNav.filter(i => i.to !== '/admin' || isAdmin) },
  ];

  return (
    <motion.div animate={{ width: collapsed ? 68 : 248 }} transition={{ type:'spring', damping:24, stiffness:150 }}
      className="flex flex-col h-full relative z-30 flex-shrink-0"
      style={{ background:'rgba(9,9,11,0.97)', borderRight:'1px solid rgba(255,255,255,0.04)', backdropFilter:'blur(20px)' }}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 flex-shrink-0 h-[60px]', collapsed ? 'justify-center px-0' : 'px-4')}
        style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <motion.div onClick={() => navigate('/dashboard')} whileTap={{ scale:0.92 }} whileHover={{ scale:1.06 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0 shadow-glow-sm"
          style={{ background:'linear-gradient(135deg, #7C5CFF, #5B8CFF)' }}>
          <Shield className="w-4 h-4 text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
              className="cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
              <p className="text-sm font-extrabold text-white tracking-tight leading-none">JusticeAI</p>
              <p className="text-[10px] text-slate-600 font-medium mt-0.5">Investigation Suite</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-area py-3 space-y-4 no-scrollbar" style={{ padding: collapsed ? '12px 10px' : '12px 10px' }}>
        {sections.map(sec => (
          <div key={sec.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="section-label px-1 mb-1">
                  {sec.label}
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
          style={{ background:'rgba(17,24,39,0.97)', border:'1px solid rgba(124,92,255,0.25)', boxShadow:'0 0 12px rgba(124,92,255,0.2)' }}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}

      {/* User footer */}
      <div className="flex-shrink-0 p-2" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div className={clsx('flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-all duration-200', collapsed && 'justify-center p-0 w-10 h-10 mx-auto')}
          onClick={() => { navigate('/profile'); onClose?.(); }}
          onMouseEnter={e => (e.currentTarget.style.background='rgba(40,46,58,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.background='transparent')}
        >
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background:'linear-gradient(135deg, #7C5CFF, #5B8CFF)', boxShadow:'0 0 12px rgba(124,92,255,0.4)' }}>
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none">{user?.full_name}</p>
                <p className="text-[10px] text-slate-600 truncate mt-0.5 capitalize">{user?.role?.replace(/_/g,' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button onClick={e => { e.stopPropagation(); handleLogout(); }}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all bg-transparent border-none">
              <LogOut className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
