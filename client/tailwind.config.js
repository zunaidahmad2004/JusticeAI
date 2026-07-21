/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Brand ─────────────────────────────────────── */
        primary: {
          50:  '#F3F0FF', 100: '#E9E5FF', 200: '#D3CAFF',
          300: '#B8A9FF', 400: '#9C7FFF', 500: '#7C5CFF',
          600: '#6B44FF', 700: '#5930E8', 800: '#4A28C4',
          900: '#3D239F', 950: '#27166B',
        },
        secondary: {
          400: '#7BAEFF', 500: '#5B8CFF', 600: '#3A6AFF',
        },
        /* ── Base surfaces ──────────────────────────────── */
        'base-bg':       '#09090B',
        'base-surface':  '#111827',
        'base-card':     '#161B22',
        'base-elevated': '#1C2333',
        'base-border':   '#21262D',
        'base-hover':    '#282E3A',
        /* ── Semantic ───────────────────────────────────── */
        'status-success': '#10B981',
        'status-warning': '#F59E0B',
        'status-error':   '#EF4444',
        'status-info':    '#5B8CFF',
        'status-pending': '#7C5CFF',
        /* ── Neon accents ───────────────────────────────── */
        neon: {
          purple: '#7C5CFF', blue: '#5B8CFF', cyan: '#22D3EE',
          green: '#10B981',  pink: '#EC4899', amber: '#F59E0B',
        },
        /* ── Kept for backward compat ───────────────────── */
        navy: {
          400: '#9C7FFF', 500: '#7C5CFF', 600: '#6B44FF',
        },
        slate: {
          50:'#F8FAFC', 100:'#F1F5F9', 200:'#E2E8F0', 300:'#CBD5E1',
          400:'#94A3B8', 500:'#64748B', 600:'#475569', 700:'#334155',
          800:'#1E293B', 850:'#172033', 900:'#0F172A', 950:'#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',   '5xl': '2.5rem',
      },
      boxShadow: {
        'glass':       '0 8px 32px 0 rgba(0,0,0,0.6)',
        'glow-xs':     '0 0 10px rgba(124,92,255,0.1)',
        'glow-sm':     '0 0 20px rgba(124,92,255,0.2)',
        'glow':        '0 0 40px rgba(124,92,255,0.3)',
        'glow-lg':     '0 0 70px rgba(124,92,255,0.4)',
        'glow-blue':   '0 0 30px rgba(91,140,255,0.3)',
        'glow-cyan':   '0 0 30px rgba(34,211,238,0.3)',
        'glow-green':  '0 0 30px rgba(16,185,129,0.3)',
        'card':        '0 4px 24px rgba(0,0,0,0.6)',
        'card-hover':  '0 12px 48px rgba(0,0,0,0.7)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.06)',
        'navbar':      '0 1px 0 rgba(255,255,255,0.04), 0 4px 40px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'shimmer':           'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        'mesh-gradient':     'radial-gradient(at 40% 20%, rgba(124,92,255,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(91,140,255,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(124,92,255,0.04) 0px, transparent 50%)',
        'primary-gradient':  'linear-gradient(135deg, #7C5CFF 0%, #5B8CFF 100%)',
        'card-gradient':     'linear-gradient(145deg, #161B22 0%, #1C2333 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':     'scaleIn 0.3s ease-out',
        'pulse-glow':   'pulseGlow 2.5s ease-in-out infinite',
        'shimmer':      'shimmer 2s infinite',
        'float':        'float 6s ease-in-out infinite',
        'gradient-x':   'gradientX 8s ease infinite',
        'border-spin':  'borderSpin 3s linear infinite',
        'aurora':       'aurora 12s ease infinite',
      },
      keyframes: {
        fadeIn:      { from:{opacity:'0'}, to:{opacity:'1'} },
        slideUp:     { from:{opacity:'0',transform:'translateY(20px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        scaleIn:     { from:{opacity:'0',transform:'scale(0.95)'}, to:{opacity:'1',transform:'scale(1)'} },
        pulseGlow:   { '0%,100%':{opacity:'1'}, '50%':{opacity:'0.5'} },
        shimmer:     { '0%':{backgroundPosition:'-200% 0'}, '100%':{backgroundPosition:'200% 0'} },
        float:       { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-10px)'} },
        gradientX:   { '0%,100%':{backgroundPosition:'0% 50%'}, '50%':{backgroundPosition:'100% 50%'} },
        borderSpin:  { from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        aurora:      { '0%,100%':{backgroundPosition:'0% 50%,0% 50%'}, '50%':{backgroundPosition:'100% 50%,100% 50%'} },
      },
    },
  },
  plugins: [],
};
