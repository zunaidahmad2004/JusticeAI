import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.email, data.password);
      if (result.requiresTwoFactor) {
        navigate('/2fa');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
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
      {/* Header with Shield Icon */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-500/10 border border-navy-500/20 mb-6">
          <Shield className="w-8 h-8 text-navy-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Welcome Back</h2>
        <p className="text-base text-slate-400">Sign in to your JusticeAI account</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="input-label">
            Email Address
          </label>
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
          {errors.email && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="input-label mb-0">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-navy-400 hover:text-navy-300 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 rounded border-base-border bg-base-elevated text-navy-500 focus:ring-2 focus:ring-navy-500/50 focus:ring-offset-0 transition-colors"
          />
          <label htmlFor="remember" className="text-sm text-slate-400 select-none cursor-pointer">
            Remember me
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full btn-lg group mt-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>

      {/* Register Link */}
      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-navy-400 hover:text-navy-300 font-semibold transition-colors">
          Register
        </Link>
      </p>

      {/* Security Notice */}
      <div className="mt-8 glass-card p-4 border-l-4 border-navy-500/30">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-navy-400 font-semibold">🔒 Authorized use enforcement and legal personnel only.</span>
          <br />
          All access is logged and monitored.
        </p>
      </div>
    </motion.div>
  );
}
