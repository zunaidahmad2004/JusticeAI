import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold text-white">JusticeAI</span>
            <p className="text-xs text-slate-500">Investigation Platform</p>
          </div>
        </div>

        {/* 404 Icon */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
            <AlertTriangle className="w-16 h-16 text-red-400" />
          </div>
        </motion.div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-white mb-4 tabular-nums tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-base text-slate-400 leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
          <br />
          Please check the URL or return to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary btn-lg">
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary btn-lg">
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-12 text-sm text-slate-600">
          Need help? Contact support at{' '}
          <a href="mailto:support@justiceai.gov" className="text-navy-400 hover:text-navy-300">
            support@justiceai.gov
          </a>
        </p>
      </motion.div>
    </div>
  );
}
