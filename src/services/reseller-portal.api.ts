// ============================================================
// RESELLER PORTAL API — Eldermin Partner Network (Phase 2)
// The partner-facing counterpart to services/resellers.api.ts (Super
// Admin side). Talks to /reseller-portal, authenticated with the
// reseller's own token (see services/resellerPortalAuth.ts) — never
// eldermin_token, which belongs to the tenant/Super-Admin session.
// ============================================================
import axios from 'axios';
import { getResellerPortalToken, resellerPortalLogout } from './resellerPortalAuth';

const rp = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/reseller-portal`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

rp.interceptors.request.use((config) => {
  const token = getResellerPortalToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

rp.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      resellerPortalLogout();
      window.location.href = '/partner/login';
    }
    return Promise.reject(err);
  },
);

export const fetchDashboard = () => rp.get('/dashboard').then(r => r.data);

export const fetchCommissionLedger = (params?: any) =>
  rp.get('/commission-ledger', { params }).then(r => r.data);

export const fetchCommissionSummary = () =>
  rp.get('/commission-summary').then(r => r.data);

export const submitProvisioningRequest = (data: any) =>
  rp.post('/provisioning-requests', data).then(r => r.data);

export const fetchProvisioningRequests = (params?: any) =>
  rp.get('/provisioning-requests', { params }).then(r => r.data);

export const registerDeal = (data: any) =>
  rp.post('/deals', data).then(r => r.data);

export const fetchDeals = (params?: any) =>
  rp.get('/deals', { params }).then(r => r.data);

// ── MDF (Phase 3, Regional Partner tier) ────────────────────────
export const fetchMdfSummary = () => rp.get('/mdf-summary').then(r => r.data);

export const submitMdfClaim = (data: any) => rp.post('/mdf-claims', data).then(r => r.data);

export const fetchMdfClaims = (params?: any) =>
  rp.get('/mdf-claims', { params }).then(r => r.data);

// ── Branding (Phase 3, Regional Partner tier) — self-serve ──────
export const fetchBranding = () => rp.get('/branding').then(r => r.data);

export const updateBranding = (data: { logoUrl?: string; accentColor?: string }) =>
  rp.patch('/branding', data).then(r => r.data);
