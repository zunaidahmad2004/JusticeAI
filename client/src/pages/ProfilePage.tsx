import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<PasswordForm>();

  const changePassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated');
    } catch {
      // handled
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      {/* Profile card */}
      <div className="card mb-6">
        <div className="card-header flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600/20 border border-primary-500/30 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-400">
              {user.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
            <p className="text-slate-400 capitalize">{user.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Email', value: user.email },
              { label: 'Badge Number', value: user.badge_number },
              { label: 'Department', value: user.department },
              { label: 'Police Station', value: user.station },
              { label: 'Phone', value: user.phone },
              { label: 'Last Login', value: user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A' },
            ].map(({ label, value }) => (
              value ? (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm text-slate-200 mt-0.5">{value}</p>
                </div>
              ) : null
            ))}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold text-white">Change Password</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(changePassword)} className="space-y-4">
            <div className="form-group">
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className={`input ${errors.currentPassword ? 'border-red-500' : ''}`}
                {...register('currentPassword', { required: 'Required' })}
              />
              {errors.currentPassword && <p className="text-xs text-red-400 mt-1">{errors.currentPassword.message}</p>}
            </div>
            <div className="form-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                className={`input ${errors.newPassword ? 'border-red-500' : ''}`}
                {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min. 8 characters' } })}
              />
              {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>}
            </div>
            <div className="form-group">
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                {...register('confirmPassword', { required: 'Required' })}
              />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
