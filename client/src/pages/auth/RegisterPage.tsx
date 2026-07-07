import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Hash, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
  full_name: string;
  badge_number: string;
  department: string;
  phone: string;
  station: string;
}

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch {
      // Error handled by API interceptor
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-500/10 border border-navy-500/20 mb-6">
          <Shield className="w-8 h-8 text-navy-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Create Account</h2>
        <p className="text-base text-slate-400">Register for JusticeAI platform access</p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name + Badge Number Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="input-label">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="full_name"
                placeholder="Officer Name"
                className={`input pl-12 ${errors.full_name ? 'input-error' : ''}`}
                {...register('full_name', { required: 'Name is required' })}
              />
            </div>
            {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="badge_number" className="input-label">Badge Number</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="badge_number"
                placeholder="Badge ID"
                className={`input pl-12 ${errors.badge_number ? 'input-error' : ''}`}
                {...register('badge_number', { required: 'Badge number required' })}
              />
            </div>
            {errors.badge_number && <p className="text-xs text-red-400 mt-1">{errors.badge_number.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="input-label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              id="email"
              type="email"
              placeholder="officer@department.gov"
              className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>

        {/* Department + Station Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="department" className="input-label">Department</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="department"
                placeholder="CID / Cyber"
                className={`input pl-12 ${errors.department ? 'input-error' : ''}`}
                {...register('department', { required: 'Department required' })}
              />
            </div>
            {errors.department && <p className="text-xs text-red-400 mt-1">{errors.department.message}</p>}
          </div>
          <div>
            <label htmlFor="station" className="input-label">Station</label>
            <input
              id="station"
              placeholder="Station name"
              className={`input ${errors.station ? 'input-error' : ''}`}
              {...register('station', { required: 'Station required' })}
            />
            {errors.station && <p className="text-xs text-red-400 mt-1">{errors.station.message}</p>}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="input-label">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
              {...register('phone', { required: 'Phone is required' })}
            />
          </div>
          {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="input-label">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={isLoading} className="btn-primary w-full btn-lg group mt-6">
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              Create Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-navy-400 hover:text-navy-300 font-semibold transition-colors">
          Sign In
        </Link>
      </p>

      {/* Notice */}
      <div className="mt-8 glass-card p-4 border-l-4 border-yellow-500/30">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-yellow-400 font-semibold">⚠ Registration requires admin approval.</span>
          <br />
          All access is logged and monitored.
        </p>
      </div>
    </motion.div>
  );
}
