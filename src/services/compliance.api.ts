import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/compliance`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export const fetchDashboard = () => api.get('/dashboard').then(r => r.data);

export const fetchPolicies = (params?: { status?: string; search?: string }) =>
  api.get('/policies', { params }).then(r => r.data);
export const createPolicy = (data: any) => api.post('/policies', data).then(r => r.data);
export const updatePolicy = (id: string, data: any) => api.put(`/policies/${id}`, data).then(r => r.data);
export const acknowledgePolicy = (id: string, data?: any) =>
  api.post(`/policies/${id}/acknowledge`, data ?? {}).then(r => r.data);

export const fetchSafeguarding = (params?: { status?: string; search?: string }) =>
  api.get('/safeguarding', { params }).then(r => r.data);
export const createSafeguarding = (data: any) => api.post('/safeguarding', data).then(r => r.data);
export const updateSafeguarding = (id: string, data: any) =>
  api.put(`/safeguarding/${id}`, data).then(r => r.data);
export const addSafeguardingNote = (id: string, note: string) =>
  api.post(`/safeguarding/${id}/note`, { note }).then(r => r.data);

export const fetchAuditLogs = (params?: { page?: number; limit?: number; action?: string }) =>
  api.get('/audit-logs', { params }).then(r => r.data);

export const fetchAccreditation = () => api.get('/accreditation').then(r => r.data);
export const createAccreditation = (data: any) => api.post('/accreditation', data).then(r => r.data);
