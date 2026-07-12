import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, CheckCircle2, AlertCircle, ChevronLeft, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const { pendingUserId, pendingEmail, verifyOTP, resendOTP, clearPending, isLoading } = useAuthStore();

  const [digits, setDigits]           = useState(['','','','','','']);
  const [rememberDevice, setRemember] = useState(false);
  const [resending, setResending]     = useState(false);
  const [countdown, setCountdown]     = useState(0);
  const [error, setError]             = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no pending 2FA
  useEffect(() => {
    if (!pendingUserId) navigate('/login', { replace: true });
  }, [pendingUserId, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const otp = digits.join('');

  const handleDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...digits];
    updated[index] = value.slice(-1);
    setDigits(updated);
    setError('');
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (updated.every((d) => d) && !value.length === false) {
      // Auto submit when all 6 digits filled
      setTimeout(() => handleVerify(updated.join('')), 80);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && otp.length === 6) handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      setTimeout(() => handleVerify(pasted), 80);
    }
  };

  const handleVerify = async (code = otp) => {
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setError('');
    try {
      await verifyOTP(code, rememberDevice);
      toast.success('Signed in successfully');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Verification failed';
      setError(msg);
      setDigits(['','','','','','']);
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await resendOTP();
      setCountdown(60);
      setDigits(['','','','','','']);
      setError('');
      inputs.current[0]?.focus();
      toast.success('New verification code sent');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    } finally { setResending(false); }
  };

  const handleBack = () => {
    clearPending();
    navigate('/login', { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-500/10 border border-navy-500/20 mb-6 relative">
          <Shield className="w-8 h-8 text-navy-400" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Two-Factor Verification
        </h2>
        <p className="text-base text-slate-400">
          Enter the 6-digit code sent to
        </p>
        {pendingEmail && (
          <p className="text-sm font-semibold text-navy-400 mt-1">{pendingEmail}</p>
        )}
      </div>

      {/* OTP Input */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-2xl border-2 bg-base-elevated text-white
                         focus:outline-none transition-all duration-200
                         ${d ? 'border-navy-500 shadow-glow-sm' : 'border-base-border'}
                         ${error ? 'border-red-500/70 shake' : ''}
                         focus:border-navy-500`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}
      </div>

      {/* Remember device */}
      <label className="flex items-center gap-3 cursor-pointer mb-6 group">
        <div
          onClick={() => setRemember((r) => !r)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
            rememberDevice ? 'bg-navy-500 border-navy-500' : 'border-base-border hover:border-slate-600 bg-base-elevated'
          }`}
        >
          {rememberDevice && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm text-slate-300 select-none">Trust this device for 30 days</span>
      </label>

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={isLoading || otp.length !== 6}
        className="btn-primary w-full btn-lg mb-5"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying...
          </span>
        ) : 'Verify & Sign In'}
      </button>

      {/* Resend */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
        {countdown > 0 ? (
          <p className="text-sm text-slate-600">
            Resend available in <span className="text-navy-400 font-semibold">{countdown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-navy-400 hover:text-navy-300 font-semibold transition-colors flex items-center gap-1.5 mx-auto"
          >
            {resending
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Resend Code</>
            }
          </button>
        )}
      </div>

      {/* Info */}
      <div className="glass-card p-4 border-l-4 border-blue-500/30 mb-6">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Check your registered email inbox. The code expires in 10 minutes.
            If SMTP is not configured, the code is logged to the server console.
          </p>
        </div>
      </div>

      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mx-auto"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Sign In
      </button>
    </motion.div>
  );
}
