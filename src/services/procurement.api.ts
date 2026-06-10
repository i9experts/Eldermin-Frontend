import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/procurement`,
  headers: {
    'Content-Type': 'application/json',
    'x-school-slug': 'demo-school',
    'x-academic-year': '2025-26',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchDashboard = () => api.get('/dashboard').then(r => r.data);

export const fetchVendors = (params?: any) => api.get('/vendors', { params }).then(r => r.data);
export const createVendor = (data: any) => api.post('/vendors', data).then(r => r.data);
export const updateVendor = (id: string, data: any) => api.put(`/vendors/${id}`, data).then(r => r.data);

export const fetchPRs = (params?: any) => api.get('/requests', { params }).then(r => r.data);
export const createPR = (data: any) => api.post('/requests', data).then(r => r.data);
export const submitPR = (id: string) => api.patch(`/requests/${id}/submit`).then(r => r.data);
export const approvePR = (id: string, data?: any) => api.patch(`/requests/${id}/approve`, data ?? {}).then(r => r.data);
export const rejectPR = (id: string, data: any) => api.patch(`/requests/${id}/reject`, data).then(r => r.data);

export const fetchPOs = (params?: any) => api.get('/orders', { params }).then(r => r.data);
export const createPO = (data: any) => api.post('/orders', data).then(r => r.data);
export const recordPayment = (id: string, data: any) => api.post(`/orders/${id}/payment`, data).then(r => r.data);

export const fetchGRNs = (params?: any) => api.get('/grn', { params }).then(r => r.data);
export const createGRN = (data: any) => api.post('/grn', data).then(r => r.data);
export const verifyGRN = (id: string) => api.patch(`/grn/${id}/verify`).then(r => r.data);

export const fetchInventory = (params?: any) => api.get('/inventory', { params }).then(r => r.data);
export const createInventoryItem = (data: any) => api.post('/inventory', data).then(r => r.data);
export const adjustStock = (id: string, data: any) => api.patch(`/inventory/${id}/adjust`, data).then(r => r.data);
export const getInventorySummary = () => api.get('/inventory/summary').then(r => r.data);
