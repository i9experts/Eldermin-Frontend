import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/finance`,
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

export const fetchCOA = () => api.get('/coa').then(r => r.data);
export const createCOAAccount = (data: any) => api.post('/coa', data).then(r => r.data);
export const seedCOA = () => api.post('/coa/seed').then(r => r.data);

export const fetchFeeStructures = (params?: { grade?: string; year?: string }) =>
  api.get('/fee-structures', { params }).then(r => r.data);
export const createFeeStructure = (data: any) => api.post('/fee-structures', data).then(r => r.data);
export const updateFeeStructure = (id: string, data: any) => api.put(`/fee-structures/${id}`, data).then(r => r.data);

export const fetchInvoices = (params?: { status?: string; grade?: string }) =>
  api.get('/invoices', { params }).then(r => r.data);
export const createInvoice = (data: any) => api.post('/invoices', data).then(r => r.data);
export const recordPayment = (invoiceId: string, data: any) =>
  api.post(`/invoices/${invoiceId}/payment`, data).then(r => r.data);

export const fetchExpenses = (params?: { status?: string; category?: string }) =>
  api.get('/expenses', { params }).then(r => r.data);
export const createExpense = (data: any) => api.post('/expenses', data).then(r => r.data);
export const approveExpense = (id: string) => api.patch(`/expenses/${id}/approve`).then(r => r.data);
export const payExpense = (id: string, data: any) => api.patch(`/expenses/${id}/pay`, data).then(r => r.data);

export const fetchBudgets = (academicYear?: string) =>
  api.get('/budgets', { params: academicYear ? { academicYear } : undefined }).then(r => r.data);
export const createBudget = (data: any) => api.post('/budgets', data).then(r => r.data);
export const approveBudget = (id: string) => api.patch(`/budgets/${id}/approve`).then(r => r.data);

export const fetchBankAccounts = () => api.get('/bank-accounts').then(r => r.data);
export const createBankAccount = (data: any) => api.post('/bank-accounts', data).then(r => r.data);
export const updateBankBalance = (id: string, balance: number) =>
  api.patch(`/bank-accounts/${id}/balance`, { balance }).then(r => r.data);

export const fetchIncomeStatement = (params: { academicYear: string; from?: string; to?: string }) =>
  api.get('/reports/income-statement', { params }).then(r => r.data);
export const fetchFeeCollection = (month: string) =>
  api.get('/reports/fee-collection', { params: { month } }).then(r => r.data);
