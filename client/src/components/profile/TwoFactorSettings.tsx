import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldOff, Smartphone,
  Trash2, RefreshCw, CheckCircle2, AlertTriangle,
  Info, Eye, EyeOff, X,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface TFAStatus {
  two_factor_enabled: boolean;
  trusted_devices:    number;
}

interface TrustedDevice {
  id:           string;
  device_name:  string;
  ip_address?:  string;
  last_used:    string;
  createdAt:    string;
  expires_at:   string;
}

type Step = 'idle' | 'enable_sent' | 'disable_confirm';

export default function TwoFactorSettings() {
  const { user, fetchMe } = useAuthStore();
  const [status, setStatus]         = useState<TFAStatus | null>(null);
  const [devices, setDevices]       = useState<TrustedDevice[]>([]);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState<Step>('idle');
  const [otp, setOtp]               = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [stRes, devRes] = await Promise.all([
        api.get('/auth/2fa/status'),
        api.get('/auth/trusted-devices'),
      ]);
      setStatus(stRes.data as TFAStatus);
      setDevices(devRes.data as TrustedDevice[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── Enable 2FA ─────────────────────────────────────────────────────── */
  const handleEnable = async () => {
    setSubmitting(true);
    try {
      await api.post('/auth/2fa/enable');
      setStep('enable_sent');
      setOtp(''); setOtpError('');
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to initiate setup');
    } finally { setSubmitting(false); }
  };

  /* ── Confirm enable OTP ─────────────────────────────────────────────── */
  const handleConfirmEnable = async () => {
    if (otp.length !== 6) { setOtpError('Enter all 6 digits'); return; }
    setSubmitting(true); setOtpError('');
    try {
      await api.post('/auth/2fa/confirm', { otp });
      toast.success('Two-factor authentication enabled!');
      await fetchMe();
      setStep('idle'); setOtp('');
      load();
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Invalid code');
    } finally { setSubmitting(false); }
  };

  /* ── Disable 2FA ────────────────────────────────────────────────────── */
  const handleDisable = async () => {
    if (!password) { toast.error('Enter your password to confirm'); return; }
    setSubmitting(true);
    try {
      await api.post('/auth/2fa/disable', { password });
      toast.success('Two-factor authentication disabled');
      await fetchMe();
      setStep('idle'); setPassword('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Incorrect password');
    } finally { setSubmitting(false); }
  };

  /* ── Revoke device ──────────────────────────────────────────────────── */
  const revokeDevice = async (id: string) => {
    if (!window.confirm('Revoke this trusted device? You will need to verify with OTP next time.')) return;
    try {
      await api.delete(`/auth/trusted-devices/${id}`);
      toast.success('Device revoked');
      load();
    } catch { toast.error('Failed to revoke'); }
  };

  const revokeAll = async () => {
    if (!window.confirm('Revoke ALL trusted devices? You will need to verify 2FA on every device.')) return;
    try {
      await api.delete('/auth/trusted-devices');
      toast.success('All devices revoked');
      load();
    } catch { toast.error('Failed to revoke'); }
  };

  if (loading) return <div className="skeleton h-48 rounded-2xl" />;

  const is2FAEnabled = user?.two_factor_enabled || status?.two_factor_enabled;

  return (
    <div className="space-y-6">

      {/* Status Banner */}
      <div className={`glass-card p-5 border-l-4 ${is2FAEnabled ? 'border-green-500/60' : 'border-yellow-500/50'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${is2FAEnabled ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              {is2FAEnabled
                ? <ShieldCheck className="w-6 h-6 text-green-400" />
                : <ShieldOff   className="w-6 h-6 text-yellow-400" />
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-0.5">
                {is2FAEnabled ? 'Two-Factor Authentication is ON' : 'Two-Factor Authentication is OFF'}
              </h3>
              <p className="text-sm text-slate-400">
                {is2FAEnabled
                  ? `Your account is protected with email OTP verification. ${status?.trusted_devices || 0} trusted device(s).`
                  : 'Enable 2FA to add an extra layer of security to your account.'
                }
              </p>
            </div>
          </div>

          {step === 'idle' && (
            <div className="flex items-center gap-3">
              {is2FAEnabled ? (
                <button
                  onClick={() => { setStep('disable_confirm'); setPassword(''); }}
                  className="btn-danger btn-sm"
                >
                  <ShieldOff className="w-4 h-4" /> Disable 2FA
                </button>
              ) : (
                <button onClick={handleEnable} disabled={submitting} className="btn-primary">
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending code...</>
                    : <><ShieldCheck className="w-4 h-4" /> Enable 2FA</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enable OTP Entry Step */}
      {step === 'enable_sent' && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-navy-400" />
            <h3 className="text-base font-bold text-white">Enter Verification Code</h3>
            <button onClick={() => setStep('idle')} className="ml-auto btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-slate-400 mb-5">
            A 6-digit code was sent to <span className="text-navy-400 font-semibold">{user?.email}</span>.
            Enter it below to activate 2FA.
          </p>
          <div className="flex gap-2 mb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] || ''}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '');
                  const arr = otp.split('');
                  arr[i] = d;
                  setOtp(arr.join('').slice(0, 6));
                  setOtpError('');
                  if (d && i < 5) (document.querySelectorAll('.otp-input')[i + 1] as HTMLInputElement)?.focus();
                }}
                className="otp-input w-12 h-12 text-center text-xl font-bold rounded-xl border-2 bg-base-elevated text-white focus:outline-none focus:border-navy-500 transition-colors border-base-border"
              />
            ))}
          </div>
          {otpError && <p className="text-sm text-red-400 flex items-center gap-1 mb-3"><AlertTriangle className="w-3.5 h-3.5" />{otpError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleConfirmEnable} disabled={submitting || otp.length !== 6} className="btn-primary flex-1">
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</> : <><CheckCircle2 className="w-4 h-4" />Activate 2FA</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* Disable Confirm Step */}
      {step === 'disable_confirm' && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="glass-card p-6 border-l-4 border-red-500/40">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-white">Confirm Disable 2FA</h3>
            <button onClick={() => setStep('idle')} className="ml-auto btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Disabling 2FA reduces your account security. Enter your password to confirm.
            All trusted devices will also be revoked.
          </p>
          <div className="relative mb-3">
            <input
              type={showPass ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Enter your current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDisable()}
            />
            <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDisable} disabled={submitting || !password} className="btn-danger flex-1">
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Disabling...</> : <><ShieldOff className="w-4 h-4" />Disable 2FA</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* Trusted Devices */}
      {is2FAEnabled && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-base-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-navy-400" />
              <h3 className="text-sm font-bold text-white">Trusted Devices</h3>
              <span className="badge-blue text-2xs">{devices.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="btn-icon w-7 h-7"><RefreshCw className="w-3.5 h-3.5" /></button>
              {devices.length > 0 && (
                <button onClick={revokeAll} className="btn-danger btn-sm text-xs">Revoke All</button>
              )}
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="p-8 text-center">
              <Smartphone className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No trusted devices yet.</p>
              <p className="text-xs text-slate-600 mt-1">Check "Trust this device" during 2FA verification to skip OTP next time.</p>
            </div>
          ) : (
            <div className="divide-y divide-base-border/50">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-base-elevated transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-navy-500/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 text-navy-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{d.device_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {d.ip_address && `IP: ${d.ip_address} · `}
                      Last used {formatDistanceToNow(new Date(d.last_used), { addSuffix: true })}
                    </p>
                    <p className="text-2xs text-slate-700">
                      Added {format(new Date(d.createdAt), 'dd MMM yyyy')} · Expires {format(new Date(d.expires_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeDevice(d.id)}
                    className="btn-icon w-8 h-8 hover:text-red-400 flex-shrink-0"
                    title="Revoke this device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-base-border">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                Trusted devices skip 2FA for 30 days. Revoke a device immediately if you lose access to it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
