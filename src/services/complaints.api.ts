import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/complaints`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const inst = safeParseLocalStorage('eldermin_institution');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export const fetchCaseTypes = () => api.get('/case-types').then(r => r.data);
export const createCaseType = (data: any) => api.post('/case-types', data).then(r => r.data);
export const updateCaseType = (id: string, data: any) => api.patch(`/case-types/${id}`, data).then(r => r.data);

export const fetchAging = () => api.get('/aging').then(r => r.data);
export const fetchCases = (params?: any) => api.get('', { params }).then(r => r.data);
export const fetchCaseById = (id: string) => api.get(`/${id}`).then(r => r.data);
export const createCase = (data: any) => api.post('', data).then(r => r.data);
export const addRemark = (id: string, text: string) => api.post(`/${id}/remarks`, { text }).then(r => r.data);
export const reassignCase = (id: string, assigneeId: string, reason?: string) =>
  api.patch(`/${id}/reassign`, { assigneeId, reason }).then(r => r.data);
export const closeCase = (id: string, resolutionNotes: string) =>
  api.patch(`/${id}/close`, { resolutionNotes }).then(r => r.data);
export const reopenCase = (id: string) => api.patch(`/${id}/reopen`).then(r => r.data);
export const runEscalationsNow = () => api.post('/run-escalations-now').then(r => r.data);
