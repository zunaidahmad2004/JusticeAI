import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface FormData { email: string; password: string; }

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState:{ errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.email, data.password);
      if (result.requiresTwoFactor) { navigate('/2fa'); }
      else { toast.success('Welcome back!'); navigate('/dashboard'); }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (err as { message?: string })?.message
        || 'Login failed. Check your credentials.';
      toast.error(message);
    }
  };

  const inputBase = 'w-full rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all duration-300 focus:outline-none';
  const inputStyle = { background:'rgba(10,14,20,0.75)', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'inset 0 2px 6px rgba(0,0,0,0.3)' };
  const inputFocusStyle = { borderColor:'rgba(99,102,241,0.5)', boxShadow:'0 0 0 3px rgba(99,102,241,0.1), inset 0 2px 6px rgba(0,0,0,0.3)' };

  const Field = ({ name, type='text', icon: Icon, placeholder, error, focusStyle, ...rest }: {
    name: string; type?: string; icon: React.ElementType;
    placeholder: string; error?: string; focusStyle?: React.CSSProperties;
    [k: string]: unknown;
  }) => (
    <div>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
        <input type={type} placeholder={placeholder}
          className={`${inputBase} pl-11 ${error ? 'border-red-500/40' : ''}`}
          style={inputStyle}
          onFocus={e => Object.assign(e.target.style, focusStyle || inputFocusStyle)}
          onBlur={e => { e.target.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.3)'; }}
          {...(rest as Record<string, unknown>)}
        />
      </div>
      {error && <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} className="text-xs text-red-400 mt-1.5 flex items-center gap-1">{error}</motion.p>}
    </div>
  );

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.4,0,0.2,1] }} className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.1 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
          style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', boxShadow:'0 0 24px rgba(99,102,241,0.12)' }}>
          <Fingerprint className="w-7 h-7 text-primary-400" />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h2>
        <p className="text-sm text-slate-500">Sign in to your JusticeAI account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="input-label">Email Address</label>
          <Field name="email" type="email" icon={Mail} placeholder="officer@department.gov" error={errors.email?.message}
            {...register('email', { required:'Email is required', pattern:{ value:/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message:'Invalid email' } })}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="input-label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              className={`${inputBase} pl-11 pr-12 ${errors.password ? 'border-red-500/40' : ''}`}
              style={inputStyle}
              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={e => { e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.3)'; }}
              {...register('password', { required:'Password is required', minLength:{ value:6, message:'Minimum 6 characters' } })}
            />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors bg-transparent border-none">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} className="text-xs text-red-400 mt-1.5">{errors.password.message}</motion.p>}
        </div>

        {/* Remember */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor:'#6366F1' }} />
          <span className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors select-none">Remember me</span>
        </label>

        {/* Submit */}
        <motion.button type="submit" disabled={isLoading} whileTap={{ scale:0.98 }} whileHover={{ scale:1.01 }}
          className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl mt-2 disabled:opacity-50"
        >
          {isLoading
            ? <span className="flex items-center justify-center gap-3"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating...</span>
            : <span className="flex items-center justify-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
          }
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Register</Link>
      </p>

      <div className="mt-6 rounded-xl p-4" style={{ background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.1)' }}>
        <p className="text-xs text-slate-600 leading-relaxed text-center">
          <span className="text-primary-400 font-semibold">🔒 Authorized personnel only.</span> All access is logged and monitored under IT Act 2000.
        </p>
      </div>

      {/* Demo hint */}
      <div className="mt-4 rounded-xl p-3" style={{ background:'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.1)' }}>
        <p className="text-[11px] text-slate-600 text-center">
          Demo: <span className="text-green-400 font-mono">admin@justiceai.com</span> / <span className="text-green-400 font-mono">Admin@2024</span>
        </p>
      </div>
    </motion.div>
  );
}
