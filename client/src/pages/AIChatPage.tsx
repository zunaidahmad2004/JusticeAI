import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Mic, Paperclip, Shield,
  Search, FileText, Scale, AlertTriangle,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const safeFormat = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

/* ─── Error Boundary ─────────────────────────────────────────────────────── */
export default function AIChatPage() {
  return (
    <ErrorBoundary>
      <AIChatInner />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center p-8">
          <div className="w-16 h-16 bg-red-900/20 border border-red-800 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Chat failed to load</h3>
          <p className="text-slate-400 text-sm mb-4 max-w-sm">{this.state.error}</p>
          <button className="btn-primary" onClick={() => this.setState({ hasError: false, error: '' })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Suggested prompts ──────────────────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: Search,       label: 'Recover deleted WhatsApp messages from a suspect device'          },
  { icon: FileText,     label: 'What digital evidence is needed in a cyber fraud investigation?'  },
  { icon: Scale,        label: 'Which BNS sections apply to a kidnapping for ransom case?'        },
  { icon: AlertTriangle,label: 'How to build a strong chargesheet for a murder case?'             },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function AIChatInner() {
  const { user } = useAuthStore();
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [sessionId, setSessionId]   = useState<string | undefined>();
  const [rows, setRows]             = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Auto-resize textarea ────────────────────────────────────────────── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const lineCount = e.target.value.split('\n').length;
    setRows(Math.min(6, Math.max(1, lineCount)));
  };

  /* ── Send ────────────────────────────────────────────────────────────── */
  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMessage: Message = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setRows(1);
    setLoading(true);

    // Streaming placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

    const updateLastMessage = (content: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content, timestamp: new Date().toISOString() };
        return updated;
      });
    };

    try {
      // Always use non-streaming for reliability — streaming requires SSE which can fail silently
      const res  = await api.post('/ai/chat', { message: msg, session_id: sessionId, stream: false });
      const data = res.data as { response: string; session_id: string };
      updateLastMessage(data.response || 'No response received. Please try again.');
      if (data.session_id) setSessionId(data.session_id);
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      updateLastMessage(errMsg || 'I encountered an error generating the response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="flex flex-col relative"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-navy-600/5 rounded-full blur-3xl" />
      </div>

      {/* ── MESSAGE AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-area relative z-10">

        {/* WELCOME SCREEN */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center justify-center min-h-full px-4 py-16 text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative mb-8"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-navy-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-bold text-white mb-3 tracking-tight"
              >
                JusticeAI Assistant
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-base text-slate-400 max-w-xl leading-relaxed mb-12"
              >
                Your AI-powered investigation partner. Ask anything about criminal law,
                forensics, evidence procedures, or case strategy.
              </motion.p>

              {/* Suggestion chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl"
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setInput(s.label); textareaRef.current?.focus(); }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-base-card/60 backdrop-blur-sm
                               border border-base-border hover:border-navy-500/40 hover:bg-base-elevated
                               transition-all duration-200 text-left group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-navy-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-navy-500/20 transition-colors">
                      <s.icon className="w-4 h-4 text-navy-400" />
                    </div>
                    <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
                      {s.label}
                    </p>
                  </button>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 text-xs text-slate-700 max-w-md"
              >
                All responses are advisory only and require expert review before official use.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MESSAGES */}
        {messages.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-navy-600 to-navy-500 text-white'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 text-navy-300 border border-slate-600'
                }`}>
                  {msg.role === 'user'
                    ? (user?.full_name?.[0]?.toUpperCase() || 'U')
                    : <Sparkles className="w-3.5 h-3.5" />
                  }
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-navy-600/20 border border-navy-500/30 rounded-3xl rounded-tr-lg px-4 py-3 text-sm text-slate-100 leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : msg.content === '' ? (
                    /* Streaming loader */
                    <div className="glass-card px-4 py-3 rounded-3xl rounded-tl-lg">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            className="w-2 h-2 rounded-full bg-navy-400 animate-bounce"
                            style={{ animationDelay: `${j * 0.18}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-200 leading-7">
                      <MarkdownMessage content={msg.content} />
                    </div>
                  )}
                  <span className="text-xs text-slate-700 px-1">{safeFormat(msg.timestamp)}</span>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── INPUT BAR ────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pb-4 pt-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass-strong rounded-3xl border border-base-border focus-within:border-navy-500/50 focus-within:shadow-glow-sm transition-all duration-300">

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={rows}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about criminal investigation, evidence, IPC/BNS, CrPC/BNSS, legal procedures..."
              className="w-full bg-transparent text-slate-100 text-sm placeholder-slate-600
                         resize-none focus:outline-none px-5 pt-4 pb-3
                         leading-relaxed min-h-[52px]"
              style={{ maxHeight: '160px' }}
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              {/* Left: attach + mic */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600
                             hover:text-slate-300 hover:bg-base-elevated transition-all duration-200"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  title="Voice input"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600
                             hover:text-slate-300 hover:bg-base-elevated transition-all duration-200"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Right: send */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  input.trim() && !loading
                    ? 'bg-gradient-to-br from-navy-600 to-navy-500 text-white shadow-glow-sm hover:shadow-glow'
                    : 'bg-base-elevated text-slate-700 cursor-not-allowed'
                }`}
                title="Send message"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-700 mt-2">
            Press <kbd className="bg-base-elevated border border-base-border rounded px-1 py-0.5 text-slate-600 text-xs font-mono">Enter</kbd> to send &nbsp;&bull;&nbsp;
            <kbd className="bg-base-elevated border border-base-border rounded px-1 py-0.5 text-slate-600 text-xs font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Markdown Renderer ──────────────────────────────────────────────────── */
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-bold text-white text-sm mt-4 mb-1.5">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-bold text-white text-base mt-5 mb-2 border-b border-slate-800 pb-1.5">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="font-bold text-white text-lg mt-5 mb-2">{renderInline(line.slice(2))}</h1>);
    } else if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} className="mb-1 leading-relaxed">{renderInline(lines[i].replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 my-3 pl-1 text-slate-300">{items}</ol>);
      continue;
    } else if (/^[\*\-•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\*\-•]\s/.test(lines[i])) {
        items.push(<li key={i} className="mb-1 leading-relaxed">{renderInline(lines[i].replace(/^[\*\-•]\s+/, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-3 pl-1 text-slate-300">{items}</ul>);
      continue;
    } else if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className="border-slate-800 my-4" />);
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={i} className="bg-base-surface border border-base-border rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto my-3 text-slate-300 leading-relaxed">
          {codeLines.join('\n')}
        </pre>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="leading-relaxed mb-1 text-slate-300">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*([^*\n]+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      parts.push(
        <code key={match.index} className="bg-base-surface border border-base-border rounded px-1.5 py-0.5 text-xs font-mono text-navy-300">
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}
