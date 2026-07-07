import { create } from 'zustand';
import api from '../lib/api';

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  status: 'open' | 'under_investigation' | 'chargesheet_filed' | 'closed' | 'archived';
  crime_type?: string;
  incident_date?: string;
  incident_location?: string;
  fir_number?: string;
  fir_date?: string;
  police_station?: string;
  assigned_io?: string;
  io_name?: string;
  sho_name?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  ai_summary?: string;
  ai_extracted_facts?: Record<string, unknown>;
  evidence_count?: number;
  witness_count?: number;
  created_at: string;
  updated_at: string;
}

interface CaseState {
  cases: Case[];
  currentCase: (Case & Record<string, unknown>) | null;
  total: number;
  isLoading: boolean;

  fetchCases: (params?: Record<string, string>) => Promise<void>;
  fetchCase: (id: string) => Promise<void>;
  createCase: (data: Partial<Case>) => Promise<Case>;
  updateCase: (id: string, data: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  setCurrentCase: (c: (Case & Record<string, unknown>) | null) => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  cases: [],
  currentCase: null,
  total: 0,
  isLoading: false,

  fetchCases: async (params = {}) => {
    set({ isLoading: true });
    const qs = new URLSearchParams(params).toString();
    const res = await api.get(`/cases?${qs}`);
    const data = res.data as { cases: Case[]; pagination: { total: number } };
    set({ cases: data.cases, total: data.pagination.total, isLoading: false });
  },

  fetchCase: async (id) => {
    set({ isLoading: true });
    const res = await api.get(`/cases/${id}`);
    set({ currentCase: res.data as Case & Record<string, unknown>, isLoading: false });
  },

  createCase: async (data) => {
    const res = await api.post('/cases', data);
    const newCase = res.data as Case;
    set((state) => ({ cases: [newCase, ...state.cases] }));
    return newCase;
  },

  updateCase: async (id, data) => {
    const res = await api.put(`/cases/${id}`, data);
    const updated = res.data as Case;
    set((state) => ({
      cases: state.cases.map((c) => (c.id === id ? updated : c)),
      currentCase: state.currentCase?.id === id
        ? { ...state.currentCase, ...updated }
        : state.currentCase,
    }));
  },

  deleteCase: async (id) => {
    await api.delete(`/cases/${id}`);
    set((state) => ({ cases: state.cases.filter((c) => c.id !== id) }));
  },

  setCurrentCase: (c) => set({ currentCase: c }),
}));
