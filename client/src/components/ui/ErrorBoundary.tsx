import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Shown instead of the default error UI – useful for inline widgets */
  fallback?: React.ReactNode;
  /** Label shown in the error card so you know which page crashed */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info });
    // Log to console so devs can see it
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}]`, error, info);
  }

  reset = () => this.setState({ hasError: false, error: null, info: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const msg = this.state.error?.message || 'Unknown error';

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="glass-panel rounded-3xl p-10 max-w-xl w-full text-center border border-red-500/20">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            {this.props.label ? `${this.props.label} — ` : ''}Something Went Wrong
          </h2>

          {/* Error message */}
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            This section encountered an unexpected error.
            The rest of the application is still working.
          </p>

          {/* Error detail (collapsible) */}
          <details className="text-left mb-6">
            <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
              Error details
            </summary>
            <pre className="mt-2 text-xs text-red-300 bg-base-surface border border-base-border rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {msg}
              {this.state.info?.componentStack ? `\n\nComponent Stack:${this.state.info.componentStack.slice(0, 600)}` : ''}
            </pre>
          </details>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={this.reset}
              className="btn-primary">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <a href="/dashboard" className="btn-secondary">
              <Home className="w-4 h-4" /> Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
