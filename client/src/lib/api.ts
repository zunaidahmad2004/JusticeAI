import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/* ─── Base URL ───────────────────────────────────────────────────────────────
   In production (Render unified deployment): VITE_API_URL is not set,
   so we use relative /api — same origin, no CORS issues.
   In dev: proxy handles /api → localhost:5000
   ─────────────────────────────────────────────────────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

/* ─── Attach token ────────────────────────────────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ─── Handle 401 + refresh ───────────────────────────────────────────────── */
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    // Never redirect on /auth/* calls — let the calling code handle it
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/');

    if (err.response?.status === 401 && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !url.includes('/auth/refresh')) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data as { accessToken: string };
          localStorage.setItem('accessToken', accessToken);
          err.config!.headers = err.config!.headers ?? {};
          err.config!.headers.Authorization = `Bearer ${accessToken}`;
          return api(err.config!);
        } catch {
          // Refresh failed — clear tokens and redirect
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Use replace to avoid adding to history stack
          if (!window.location.pathname.startsWith('/login') &&
              !window.location.pathname.startsWith('/register') &&
              window.location.pathname !== '/') {
            window.location.replace('/login');
          }
        }
      } else if (!refreshToken) {
        // No refresh token — only redirect if on a protected page
        if (!window.location.pathname.startsWith('/login') &&
            !window.location.pathname.startsWith('/register') &&
            window.location.pathname !== '/') {
          window.location.replace('/login');
        }
      }
    }

    const message =
      (err.response?.data as { error?: string; message?: string })?.error ||
      (err.response?.data as { error?: string; message?: string })?.message ||
      err.message ||
      'Something went wrong';

    // Always show a toast for auth endpoint errors (wrong password, user not found, etc.)
    // For 401 on non-auth endpoints we skip the toast since redirect handles it
    if (isAuthEndpoint) {
      toast.error(message);
    } else if (err.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(err);
  }
);

export default api;
