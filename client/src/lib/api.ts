import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes — AI routes can take time
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      // Try refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && err.config && !err.config.url?.includes('/auth/refresh')) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
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
