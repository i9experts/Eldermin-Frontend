import axios from 'axios';

const sa = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/super-admin/resellers`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

sa.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchResellers = (params?: any) =>
  sa.get('/', { params }).then(r => r.data);

export const getReseller = (id: string) =>
  sa.get(`/${id}`).then(r => r.data);

export const createReseller = (data: any) =>
  sa.post('/', data).then(r => r.data);

export const updateReseller = (id: string, data: any) =>
  sa.patch(`/${id}`, data).then(r => r.data);

export const updateResellerStatus = (id: string, data: { status: string; reason?: string }) =>
  sa.patch(`/${id}/status`, data).then(r => r.data);

export const provisionInstitution = (id: string, data: any) =>
  sa.post(`/${id}/institutions`, data).then(r => r.data);

export const getCommissionSummary = (id: string) =>
  sa.get(`/${id}/commission-summary`).then(r => r.data);
