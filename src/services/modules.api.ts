import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${BASE}/api/v1/modules`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  return config;
});

export interface ModuleItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  requiredModules: string[];
  recommendedModules: string[];
  isCore: boolean;
  pricingTier: string;
  status: 'active' | 'available' | 'locked';
  missingDependencies: string[];
  recommendedNames: string[];
}

export const modulesApi = {
  list: async (): Promise<ModuleItem[]> => {
    const { data } = await api.get('/');
    return data;
  },
  summary: async () => {
    const { data } = await api.get('/summary');
    return data;
  },
  activate: async (moduleId: string) => {
    const { data } = await api.post(`/${moduleId}/activate`);
    return data;
  },
  deactivate: async (moduleId: string) => {
    const { data } = await api.post(`/${moduleId}/deactivate`);
    return data;
  },
};
