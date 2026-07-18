import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Shield, Search, FileText,
  Scale, AlertTriangle, Copy, Check, RefreshCw,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  error?: boolean;
}

const uid = () => Math.random().toString(36).slice(2);
const fmt = (d: string) => {
  try {
    const t = new Date(d);
    return isNaN(t.getTime()) ? '' : t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const SUGGESTIONS = [
  { icon: Search,        label: 'How to recover deleted WhatsApp messages from a suspect device?' },
  { icon: FileText,      label: 'What digital evidence is needed in a cyber fraud investigation?' },
  { icon: Scale,         label: 'Which BNS sections apply to a kidnapping for ransom case?'       },
  { icon: AlertTriangle, label: 'How to build a strong chargesheet for a murder case?'            },
];

export default function AIChatPage() {
  return <ErrorBoundary><AIChatInner /></ErrorBoundary>;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string }
> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { error: '' }; }
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <Sparkles className="w-10 h-10 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Chat failed to load</h3>
        <p className="text-slate-400 text-sm mb-4">{this.state.error}</p>
        <button className="btn-primary" onClick={() => this.setState({ error: '' })}>Try Again</button>
      </div>
    );
    return this.props.children;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      title="Copy"
      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-base-elevated transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function AIChatInner() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [rows, setRows] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateLast = useCallback((patch: Partial<Message>) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], ...patch };
      return updated;
    });
  }, []);

  const doSend = useCallback(async (text: string, replaceId?: string) => {
    if (!text.trim() || loading) return;

    if (!replaceId) {
      setMessages(prev => [...prev, {
        id: uid(), role: 'user', content: text, timestamp: new Date().toISOString(),
      }]);
    }

    const placeholder: Message = { id: replaceId || uid(), role: 'assistant', content: '', timestamp: new Date().toISOString() };

    if (replaceId) {
      setMessages(prev => prev.map(m => m.id === replaceId ? placeholder : m));
    } else {
      setMessages(prev => [...prev, placeholder]);
    }

    setInput('');
    setRows(1);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: text, session_id: sessionId, stream: false });
      const data = res.data as { response: string; session_id: string };
      if (!data.response) throw new Error('Empty response from AI');
      updateLast({ content: data.response, timestamp: new Date().toISOString() });
      if (data.session_id) setSessionId(data.session_id);
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      const msg = apiErr?.error || apiErr?.details || (err as Error)?.message || 'Unknown error';
      const isConfigError = msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('api') || msg.toLowerCase().includes('auth');
      const errorContent = isConfigError
        ? `⚠️ **AI service not configured**\n\nThe Gemini API credentials are missing or invalid on the server.\n\nPlease set \`GEMINI_CREDENTIALS_B64\` in the Render environment variables.\n\nError: \`${msg}\``
        : `⚠️ **Could not generate response**\n\n${msg}\n\nPlease try again.`;
      updateLast({ content: errorContent, error: true, timestamp: new Date().toISOString() });
      toast.error('AI response failed');
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, updateLast]);

  const sendMessage = () => doSend(input);

  const regenerate = (msg: Message) => {
    const idx = messages.findIndex(m => m.id === msg.id);
    const userMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
    if (userMsg) doSend(userMsg.content, msg.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setRows(Math.min(6, Math.max(1, e.target.value.split('\n').length)));
  };

  return (
    <div className="flex flex-col relative" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-navy-600/5 rounded-full blur-3xl" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-area relative z-10">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div key="welcome"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-full px-4 py-16 text-center"
            >
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="relative mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-glow">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-navy-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-3 tracking-tight">
                JusticeAI Assistant
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-base text-slate-400 max-w-xl leading-relaxed mb-12">
                Your AI-powered investigation partner. Ask anything about criminal law,
                forensics, evidence procedures, or case strategy.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map(s => (
                  <button key={s.label}
                    onClick={() => { setInput(s.label); textareaRef.current?.focus(); }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-base-card/60 border border-base-border hover:border-navy-500/40 hover:bg-base-elevated transition-all duration-200 text-left group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-navy-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-navy-500/20 transition-colors">
                      <s.icon className="w-4 h-4 text-navy-400" />
                    </div>
                    <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{s.label}</p>
                  </button>
                ))}
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="mt-10 text-xs text-slate-700 max-w-md">
                All responses are advisory only and require expert review before official use.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg, i) => (
              <motion.div key={msg.id || i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-navy-600 to-navy-500 text-white'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 text-navy-300 border border-slate-600'
                }`}>
                  {msg.role === 'user' ? (user?.full_name?.[0]?.toUpperCase() || 'U') : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-navy-600/20 border border-navy-500/30 rounded-3xl rounded-tr-lg px-4 py-3 text-sm text-slate-100 leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : msg.content === '' ? (
                    <div className="glass-card px-4 py-3 rounded-3xl rounded-tl-lg">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map(j => (
                          <span key={j} className="w-2 h-2 rounded-full bg-navy-400 animate-bounce"
                            style={{ animationDelay: `${j * 0.18}s` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-3xl rounded-tl-lg px-4 py-3 ${msg.error ? 'bg-red-900/20 border border-red-800/40' : 'glass-card'}`}>
                      <div className="text-sm text-slate-200 leading-7">
                        <MarkdownMessage content={msg.content} />
                      </div>
                      {/* Action row */}
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800/50">
                        <CopyButton text={msg.content} />
                        <button onClick={() => regenerate(msg)} disabled={loading}
                          title="Regenerate response"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-base-elevated transition-all disabled:opacity-40">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-slate-700 ml-auto">{fmt(msg.timestamp)}</span>
                      </div>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <span className="text-xs text-slate-700 px-1">{fmt(msg.timestamp)}</span>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative z-10 px-4 pb-4 pt-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass-strong rounded-3xl border border-base-border focus-within:border-navy-500/50 focus-within:shadow-glow-sm transition-all duration-300">
            <textarea
              ref={textareaRef}
              rows={rows}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about criminal investigation, evidence, IPC/BNS, CrPC/BNSS, legal procedures..."
              className="w-full bg-transparent text-slate-100 text-sm placeholder-slate-600 resize-none focus:outline-none px-5 pt-4 pb-3 leading-relaxed min-h-[52px]"
              style={{ maxHeight: '160px' }}
            />
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <span className="text-xs text-slate-700">Powered by Google Gemini 2.5 Flash</span>
              <motion.button whileTap={{ scale: 0.92 }} onClick={sendMessage}
                disabled={loading || !input.trim()}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  input.trim() && !loading
                    ? 'bg-gradient-to-br from-navy-600 to-navy-500 text-white shadow-glow-sm hover:shadow-glow'
                    : 'bg-base-elevated text-slate-700 cursor-not-allowed'
                }`}
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </motion.button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-700 mt-2">
            Press <kbd className="bg-base-elevated border border-base-border rounded px-1 py-0.5 text-xs font-mono">Enter</kbd> to send &nbsp;·&nbsp;
            <kbd className="bg-base-elevated border border-base-border rounded px-1 py-0.5 text-xs font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Markdown renderer ──────────────────────────────────────────────────── */

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### '))      { out.push(<h3 key={i} className="font-bold text-white text-sm mt-4 mb-1.5">{inline(line.slice(4))}</h3>); }
    else if (line.startsWith('## ')) { out.push(<h2 key={i} className="font-bold text-white text-base mt-5 mb-2 border-b border-slate-800 pb-1.5">{inline(line.slice(3))}</h2>); }
    else if (line.startsWith('# '))  { out.push(<h1 key={i} className="font-bold text-white text-lg mt-5 mb-2">{inline(line.slice(2))}</h1>); }
    else if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} className="mb-1 leading-relaxed">{inline(lines[i].replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      out.push(<ol key={`ol${i}`} className="list-decimal list-inside my-3 pl-1 text-slate-300 space-y-0.5">{items}</ol>);
      continue;
    } else if (/^[*\-•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[*\-•]\s/.test(lines[i])) {
        items.push(<li key={i} className="mb-1 leading-relaxed">{inline(lines[i].replace(/^[*\-•]\s+/, ''))}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} className="list-disc list-inside my-3 pl-1 text-slate-300 space-y-0.5">{items}</ul>);
      continue;
    } else if (line.trim() === '---') {
      out.push(<hr key={i} className="border-slate-800 my-4" />);
    } else if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      out.push(
        <pre key={i} className="bg-base-surface border border-base-border rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto my-3 text-slate-300 leading-relaxed">
          {code.join('\n')}
        </pre>
      );
    } else if (line.trim() === '') {
      out.push(<div key={i} className="h-2" />);
    } else {
      out.push(<p key={i} className="leading-relaxed mb-1 text-slate-300">{inline(line)}</p>);
    }
    i++;
  }
  return <div className="space-y-0.5">{out}</div>;
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*([^*\n]+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2])      parts.push(<strong key={m.index} className="font-semibold text-white">{m[2]}</strong>);
    else if (m[3]) parts.push(<em     key={m.index} className="italic text-slate-200">{m[3]}</em>);
    else if (m[4]) parts.push(<code   key={m.index} className="bg-base-surface border border-base-border rounded px-1.5 py-0.5 text-xs font-mono text-navy-300">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}
