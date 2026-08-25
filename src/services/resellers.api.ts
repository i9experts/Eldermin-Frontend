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

// ── Commission & Billing Engine (Phase 2) ──────────────────────
export const runCommissionBatch = (periodMonth?: string) =>
  sa.post('/commission-batch/run', { periodMonth }).then(r => r.data);

export const getCommissionLedger = (id: string, params?: any) =>
  sa.get(`/${id}/commission-ledger`, { params }).then(r => r.data);

// ── Self-serve provisioning queue (Phase 2) ────────────────────
export const getProvisioningQueue = (params?: any) =>
  sa.get('/provisioning-requests', { params }).then(r => r.data);

export const reviewProvisioningRequest = (id: string, data: { decision: 'approved' | 'rejected'; reviewNote?: string }) =>
  sa.patch(`/provisioning-requests/${id}/review`, data).then(r => r.data);

// ── Deal registration (Phase 2) ────────────────────────────────
export const getDeals = (params?: any) =>
  sa.get('/deals', { params }).then(r => r.data);

export const convertDeal = (id: string, institutionId: string) =>
  sa.patch(`/deals/${id}/convert`, { institutionId }).then(r => r.data);

export const rejectDeal = (id: string, reviewNote?: string) =>
  sa.patch(`/deals/${id}/reject`, { reviewNote }).then(r => r.data);

// ── Reseller Portal v1 — account provisioning ──────────────────
export const createPortalUser = (id: string, data: { email: string; name?: string; role?: string }) =>
  sa.post(`/${id}/portal-users`, data).then(r => r.data);

export const getPortalUsers = (id: string) =>
  sa.get(`/${id}/portal-users`).then(r => r.data);

// ── MDF budget & claims (Phase 3) ───────────────────────────────
export const setMdfBudget = (id: string, amount: number, fiscalYear: number) =>
  sa.patch(`/${id}/mdf-budget`, { amount, fiscalYear }).then(r => r.data);

export const getMdfSummary = (id: string) =>
  sa.get(`/${id}/mdf-summary`).then(r => r.data);

export const getMdfClaims = (params?: any) =>
  sa.get('/mdf-claims', { params }).then(r => r.data);

export const reviewMdfClaim = (id: string, data: { decision: 'approved' | 'rejected'; amountApproved?: number; reviewNote?: string }) =>
  sa.patch(`/mdf-claims/${id}/review`, data).then(r => r.data);

export const payMdfClaim = (id: string, data: { paymentMethod: string; bankAccountId?: string; referenceNumber?: string; paymentDate?: string }) =>
  sa.patch(`/mdf-claims/${id}/pay`, data).then(r => r.data);

// ── Branding (Phase 3) ──────────────────────────────────────────
export const setBranding = (id: string, data: { logoUrl?: string; accentColor?: string }) =>
  sa.patch(`/${id}/branding`, data).then(r => r.data);
