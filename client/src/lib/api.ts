import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/* ─── Base URL — uses env var in production, proxy in dev ─────────────────── */
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
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && err.config && !err.config.url?.includes('/auth/refresh')) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data as { accessToken: string };
          localStorage.setItem('accessToken', accessToken);
          err.config.headers = err.config.headers ?? {};
          err.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    const message =
      (err.response?.data as { error?: string })?.error ||
      err.message ||
      'Something went wrong';

    if (err.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(err);
  }
);

export default api;
