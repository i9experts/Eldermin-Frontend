import axios from 'axios';

const leads = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/leads`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

leads.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getLeads = (stage?: string) =>
  leads.get('/', { params: stage ? { stage } : {} }).then(r => r.data);

export const getLeadStats = () =>
  leads.get('/stats').then(r => r.data);

export const getLead = (id: string) =>
  leads.get(`/${id}`).then(r => r.data);

export const updateLead = (id: string, data: { stage?: string; assignedTo?: string }) =>
  leads.patch(`/${id}`, data).then(r => r.data);

export const addLeadNote = (id: string, text: string) =>
  leads.post(`/${id}/notes`, { text }).then(r => r.data);
