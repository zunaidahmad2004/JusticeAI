import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, type Variants } from 'framer-motion';
import { User, Key, Shield, Building2, Eye, EyeOff, Save, Edit } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import TwoFactorSettings from '../components/profile/TwoFactorSettings';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const fade: Variants = { hidden: { opacity:0, y:12 }, show: { opacity:1, y:0, transition: { duration:0.35 } } };

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab]         = useState<'profile'|'security'|'2fa'>('profile');
  const [editMode, setEditMode] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name:   user?.full_name   || '',
    badge_number:user?.badge_number|| '',
    department:  user?.department  || '',
    station:     user?.station     || '',
    phone:       user?.phone       || '',
  });

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<PasswordForm>();

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', profileForm);
      await fetchMe();
      toast.success('Profile updated');
      setEditMode(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const changePassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated successfully');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile',  icon: User   },
    { id: 'security',label: 'Security', icon: Key    },
    { id: '2fa',     label: '2FA',      icon: Shield },
  ] as const;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-6 max-w-3xl">

      {/* Header */}
      <motion.div variants={fade}>
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your profile, security, and authentication preferences</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={fade} className="glass-card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-400 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-glow">
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="badge-blue text-2xs capitalize">{user?.role?.replace(/_/g, ' ')}</span>
            {user?.badge_number && <span className="badge-slate text-2xs">Badge: {user.badge_number}</span>}
            {user?.two_factor_enabled && <span className="badge-green text-2xs flex items-center gap-1"><Shield className="w-2.5 h-2.5" />2FA On</span>}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fade}>
        <div className="flex items-center gap-1 p-1 bg-base-surface rounded-xl border border-base-border w-fit">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                tab === t.id ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <motion.div key="profile" initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-5">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Personal Information</h3>
              {!editMode
                ? <button onClick={() => setEditMode(true)} className="btn-secondary btn-sm"><Edit className="w-4 h-4" /> Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="btn-secondary btn-sm">Cancel</button>
                    <button onClick={saveProfile} disabled={saving} className="btn-primary btn-sm">
                      {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-3.5 h-3.5" />Save</>}
                    </button>
                  </div>
              }
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key:'full_name',    label:'Full Name',       placeholder:'Your full name' },
                { key:'badge_number', label:'Badge Number',    placeholder:'Badge ID' },
                { key:'department',   label:'Department',      placeholder:'e.g. CID, Cyber' },
                { key:'station',      label:'Police Station',  placeholder:'Station name' },
                { key:'phone',        label:'Phone Number',    placeholder:'+91 98765 43210' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="input-label">{f.label}</label>
                  {editMode
                    ? <input className="input" placeholder={f.placeholder}
                        value={(profileForm as any)[f.key]}
                        onChange={(e) => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    : <p className="text-sm text-slate-200 py-2.5 px-4 bg-base-surface rounded-xl border border-base-border">
                        {(user as any)?.[f.key] || <span className="text-slate-600">Not set</span>}
                      </p>
                  }
                </div>
              ))}
              <div>
                <label className="input-label">Email Address</label>
                <p className="text-sm text-slate-400 py-2.5 px-4 bg-base-surface rounded-xl border border-base-border">{user?.email}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <motion.div key="security" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Key className="w-5 h-5 text-navy-400" /> Change Password
            </h3>
            <form onSubmit={handleSubmit(changePassword)} className="space-y-4">
              <div>
                <label className="input-label">Current Password</label>
                <div className="relative">
                  <input type={showCur ? 'text' : 'password'} className="input pr-10"
                    {...register('currentPassword', { required: 'Required' })} />
                  <button type="button" onClick={() => setShowCur(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-xs text-red-400 mt-1">{errors.currentPassword.message}</p>}
              </div>
              <div>
                <label className="input-label">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} className="input pr-10"
                    {...register('newPassword', { required:'Required', minLength:{ value:8, message:'Minimum 8 characters' } })} />
                  <button type="button" onClick={() => setShowNew(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>}
              </div>
              <div>
                <label className="input-label">Confirm New Password</label>
                <input type="password" className="input"
                  {...register('confirmPassword', { required:'Required' })} />
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</> : <><Key className="w-4 h-4" />Update Password</>}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* 2FA Tab */}
      {tab === '2fa' && (
        <motion.div key="2fa" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <TwoFactorSettings />
        </motion.div>
      )}
    </motion.div>
  );
}
