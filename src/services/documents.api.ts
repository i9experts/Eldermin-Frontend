import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://93.127.163.238:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/documents`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = '2025-26';
  return config;
});

export const fetchDashboard = () => api.get('/dashboard').then(r => r.data);

export const fetchDocuments = (params?: { category?: string; status?: string; search?: string }) =>
  api.get('/', { params }).then(r => r.data);
export const createDocument = (data: any) => api.post('/', data).then(r => r.data);
export const updateDocument = (id: string, data: any) => api.put(`/${id}`, data).then(r => r.data);
export const archiveDocument = (id: string) => api.patch(`/${id}/archive`).then(r => r.data);
export const incrementView = (id: string) => api.patch(`/${id}/view`).then(r => r.data);

export const fetchWorkflowTemplates = (type?: string) =>
  api.get('/workflow-templates', { params: type ? { type } : undefined }).then(r => r.data);
export const createWorkflowTemplate = (data: any) => api.post('/workflow-templates', data).then(r => r.data);
export const seedWorkflowTemplates = () => api.post('/workflow-templates/seed').then(r => r.data);

export const fetchWorkflows = (params?: { status?: string; type?: string }) =>
  api.get('/workflows', { params }).then(r => r.data);
export const fetchMyApprovals = () => api.get('/workflows/my-approvals').then(r => r.data);
export const initiateWorkflow = (data: any) => api.post('/workflows', data).then(r => r.data);
export const takeAction = (id: string, data: any) => api.patch(`/workflows/${id}/action`, data).then(r => r.data);
export const cancelWorkflow = (id: string, reason: string) =>
  api.patch(`/workflows/${id}/cancel`, { reason }).then(r => r.data);
