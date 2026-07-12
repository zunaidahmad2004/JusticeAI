import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FolderOpen, Microscope,
  Archive, Bot, BarChart3, Bell,
  Settings, ScrollText, ChevronRight,
  Shield, LogOut, Scale, ShieldAlert,
  Calendar, FileText, Share2, Users, Heart,
  Fingerprint, Clock, BookOpen, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  badgeColor?: string;
}

const mainNav: NavItem[] = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/cases',        icon: FolderOpen,      label: 'Cases'        },
  { to: '/evidence',     icon: Archive,         label: 'Evidence'     },
  { to: '/suspects',     icon: Fingerprint,     label: 'Suspects'     },
  { to: '/witnesses',    icon: Users,           label: 'Witnesses'    },
  { to: '/victims',      icon: Heart,           label: 'Victims'      },
];

const firNav: NavItem[] = [
  { to: '/case-filing',  icon: Scale,           label: 'Smart FIR Filing'  },
  { to: '/fir-analyzer', icon: Microscope,      label: 'FIR Analyzer'      },
];

const legalNav: NavItem[] = [
  { to: '/legal',         icon: BookOpen,       label: 'Legal Provisions'  },
  { to: '/risk-analysis', icon: ShieldAlert,    label: 'Risk Analysis'     },
  { to: '/graph',         icon: Share2,         label: 'Crime Graph'       },
  { to: '/court-calendar',icon: Calendar,       label: 'Court Calendar'    },
];

const aiNav: NavItem[] = [
  { to: '/ai-chat',  icon: Bot,           label: 'AI Assistant', badge: 'AI', badgeColor: 'text-primary-400 bg-primary-500/10' },
  { to: '/reports',  icon: ClipboardList, label: 'Reports'      },
  { to: '/analytics',icon: BarChart3,     label: 'Analytics'    },
];

const systemNav: NavItem[] = [
  { to: '/notifications', icon: Bell,        label: 'Notifications' },
  { to: '/profile',       icon: Settings,    label: 'Settings'      },
  { to: '/admin',         icon: ScrollText,  label: 'Audit Logs'    },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user && ['admin', 'super_admin'].includes(user.role);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  const NavItemComp = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.to ||
      (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
    return (
      <NavLink
        to={item.to}
        onClick={onClose}
        className={clsx(
          'nav-item relative',
          isActive && 'active'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 bg-primary-500/10 rounded-xl border border-primary-500/20"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <item.icon className={clsx(
          'nav-item-icon relative z-10',
          isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
        )} />
        <span className="relative z-10 flex-1">{item.label}</span>
        {item.badge && (
          <span className={clsx('relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-md', item.badgeColor)}>
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A] border-r border-[#1E293B] w-64">

      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E293B] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800
                        flex items-center justify-center shadow-glow-sm flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">JusticeAI</p>
          <p className="text-[10px] text-slate-500 font-medium">Investigation Platform</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto btn-icon w-7 h-7">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scroll-area px-3 py-3 space-y-5">

        {/* Investigation */}
        <div>
          <p className="section-label">Investigation</p>
          <div className="space-y-0.5">
            {mainNav.map((item) => <NavItemComp key={item.to} item={item} />)}
          </div>
        </div>

        {/* FIR & Filing */}
        <div>
          <p className="section-label">FIR & Filing</p>
          <div className="space-y-0.5">
            {firNav.map((item) => <NavItemComp key={item.to} item={item} />)}
          </div>
        </div>

        {/* Legal & Analysis */}
        <div>
          <p className="section-label">Legal & Analysis</p>
          <div className="space-y-0.5">
            {legalNav.map((item) => <NavItemComp key={item.to} item={item} />)}
          </div>
        </div>

        {/* AI & Reports */}
        <div>
          <p className="section-label">AI & Reports</p>
          <div className="space-y-0.5">
            {aiNav.map((item) => <NavItemComp key={item.to} item={item} />)}
          </div>
        </div>

        {/* System */}
        <div>
          <p className="section-label">System</p>
          <div className="space-y-0.5">
            {systemNav
              .filter((item) => item.to !== '/admin' || isAdmin)
              .map((item) => <NavItemComp key={item.to} item={item} />)}
          </div>
        </div>

      </nav>

      {/* ── User ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#1E293B] px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#1E293B] transition-colors cursor-pointer group"
          onClick={() => { navigate('/profile'); onClose?.(); }}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800
                          flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-glow-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate capitalize">
              {user?.role?.replace(/_/g, ' ')} {user?.badge_number ? `• ${user.badge_number}` : ''}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="opacity-0 group-hover:opacity-100 btn-icon w-7 h-7 flex-shrink-0
                       hover:bg-red-500/20 hover:text-red-400 transition-all"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
