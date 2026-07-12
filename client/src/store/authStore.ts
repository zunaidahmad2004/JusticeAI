import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  badge_number?: string;
  department?: string;
  station?: string;
  phone?: string;
  avatar_url?: string;
  two_factor_enabled?: boolean;
  last_login?: string;
}

interface AuthState {
  user:            User | null;
  accessToken:     string | null;
  refreshToken:    string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;

  // 2FA pending state
  pending2FA:      boolean;
  pendingUserId:   string | null;
  pendingEmail:    string | null;

  login:        (email: string, password: string) => Promise<{ requiresTwoFactor: boolean; user_id?: string; email_hint?: string }>;
  verifyOTP:    (otp: string, rememberDevice?: boolean) => Promise<void>;
  resendOTP:    () => Promise<void>;
  register:     (data: RegisterData) => Promise<void>;
  logout:       () => Promise<void>;
  fetchMe:      () => Promise<void>;
  setTokens:    (accessToken: string, refreshToken: string) => void;
  clearPending: () => void;
}

interface RegisterData {
  email: string; password: string; full_name: string;
  role?: string; badge_number?: string; department?: string;
  station?: string; phone?: string;
}

const DEVICE_TOKEN_KEY = 'justiceai_device_token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isLoading:       false,
      isAuthenticated: false,
      pending2FA:      false,
      pendingUserId:   null,
      pendingEmail:    null,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken',  accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
          const res = await api.post('/auth/login', { email, password, device_token: deviceToken || undefined });
          const data = res.data as {
            requiresTwoFactor: boolean;
            user_id?: string;
            email_hint?: string;
            user?: User;
            accessToken?: string;
            refreshToken?: string;
          };

          if (data.requiresTwoFactor) {
            set({
              isLoading:    false,
              pending2FA:   true,
              pendingUserId:data.user_id || null,
              pendingEmail: data.email_hint || null,
            });
            return { requiresTwoFactor: true, user_id: data.user_id, email_hint: data.email_hint };
          }

          // Direct login (no 2FA)
          if (data.accessToken && data.user) {
            localStorage.setItem('accessToken',  data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken || '');
            set({
              user: data.user, accessToken: data.accessToken,
              refreshToken: data.refreshToken || null,
              isAuthenticated: true, isLoading: false,
              pending2FA: false, pendingUserId: null, pendingEmail: null,
            });
          }
          return { requiresTwoFactor: false };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      verifyOTP: async (otp, rememberDevice = false) => {
        const { pendingUserId } = get();
        if (!pendingUserId) throw new Error('No pending login session');
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/verify-otp', {
            user_id:       pendingUserId,
            otp:           otp.trim(),
            remember_device: rememberDevice,
          });
          const data = res.data as {
            user: User; accessToken: string; refreshToken: string; device_token?: string;
          };
          localStorage.setItem('accessToken',  data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          // Save trusted device token
          if (data.device_token) {
            localStorage.setItem(DEVICE_TOKEN_KEY, data.device_token);
          }

          set({
            user: data.user, accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true, isLoading: false,
            pending2FA: false, pendingUserId: null, pendingEmail: null,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      resendOTP: async () => {
        const { pendingUserId } = get();
        if (!pendingUserId) throw new Error('No pending login session');
        await api.post('/auth/resend-otp', { user_id: pendingUserId });
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          const { user, accessToken, refreshToken } = res.data as { user: User; accessToken: string; refreshToken: string };
          localStorage.setItem('accessToken',  accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          await api.post('/auth/logout', { refreshToken });
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Keep device token for future trusted device bypass
        set({
          user: null, accessToken: null, refreshToken: null,
          isAuthenticated: false, isLoading: false,
          pending2FA: false, pendingUserId: null, pendingEmail: null,
        });
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: (res.data as { user: User }).user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      clearPending: () => set({ pending2FA: false, pendingUserId: null, pendingEmail: null }),
    }),
    {
      name: 'justice-ai-auth',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
