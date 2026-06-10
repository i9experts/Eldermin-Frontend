import axios from 'axios';

const sa = axios.create({
  baseURL: 'http://93.127.163.238:3001/api/v1/super-admin',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

sa.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchBIDashboard = () =>
  sa.get('/dashboard').then(r => r.data);

export const fetchInstitutions = (params?: any) =>
  sa.get('/institutions', { params }).then(r => r.data);

export const getInstitution = (slug: string) =>
  sa.get(`/institutions/${slug}`).then(r => r.data);

export const createInstitution = (data: any) =>
  sa.post('/institutions', data).then(r => r.data);

export const updateStatus = (slug: string, data: any) =>
  sa.patch(`/institutions/${slug}/status`, data).then(r => r.data);

export const updateSubscription = (slug: string, data: any) =>
  sa.patch(`/institutions/${slug}/subscription`, data).then(r => r.data);

export const getAlerts = () =>
  sa.get('/alerts').then(r => r.data);

export const getAnalytics = () =>
  sa.get('/analytics').then(r => r.data);

export const getAnnouncements = () =>
  sa.get('/announcements').then(r => r.data);

export const createAnnouncement = (data: any) =>
  sa.post('/announcements', data).then(r => r.data);

export const getTickets = (params?: any) =>
  sa.get('/tickets', { params }).then(r => r.data);

export const updateTicket = (id: string, data: any) =>
  sa.put(`/tickets/${id}`, data).then(r => r.data);
