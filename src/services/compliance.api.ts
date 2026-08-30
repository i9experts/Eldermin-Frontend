import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/compliance`,
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
export const updateAccreditation = (id: string, data: any) => api.put(`/accreditation/${id}`, data).then(r => r.data);

// ── Attendance Compliance ────────────────────────────────────────
export const fetchAttendanceSettings = () => api.get('/attendance/settings').then(r => r.data);
export const updateAttendanceSettings = (data: any) => api.put('/attendance/settings', data).then(r => r.data);
export const fetchAttendanceCompliance = (params?: { from?: string; to?: string }) =>
  api.get('/attendance/compliance', { params }).then(r => r.data);

// ── Governance: Multi-Campus Rollup ──────────────────────────────
export const fetchGovernanceRollup = () => api.get('/governance/rollup').then(r => r.data);

// ── Data Privacy: Consent Records ────────────────────────────────
export const fetchConsentRecords = (params?: { subjectType?: string; consentType?: string; status?: string }) =>
  api.get('/data-privacy/consent-records', { params }).then(r => r.data);
export const createConsentRecord = (data: any) => api.post('/data-privacy/consent-records', data).then(r => r.data);
export const updateConsentRecord = (id: string, data: any) =>
  api.put(`/data-privacy/consent-records/${id}`, data).then(r => r.data);
export const deleteConsentRecord = (id: string) =>
  api.delete(`/data-privacy/consent-records/${id}`).then(r => r.data);

// ── Data Privacy: Retention Policies ─────────────────────────────
export const fetchRetentionPolicies = (params?: { isActive?: boolean }) =>
  api.get('/data-privacy/retention-policies', { params }).then(r => r.data);
export const createRetentionPolicy = (data: any) => api.post('/data-privacy/retention-policies', data).then(r => r.data);
export const updateRetentionPolicy = (id: string, data: any) =>
  api.put(`/data-privacy/retention-policies/${id}`, data).then(r => r.data);
export const deleteRetentionPolicy = (id: string) =>
  api.delete(`/data-privacy/retention-policies/${id}`).then(r => r.data);
export const seedRetentionPolicyDefaults = () =>
  api.post('/data-privacy/retention-policies/seed-defaults').then(r => r.data);

// ── Data Privacy: Data Subject Requests (DSAR) ───────────────────
export const fetchDsarRequests = (params?: { status?: string; requestType?: string; dataSubjectType?: string }) =>
  api.get('/data-privacy/dsar', { params }).then(r => r.data);
export const createDsarRequest = (data: any) => api.post('/data-privacy/dsar', data).then(r => r.data);
export const updateDsarRequest = (id: string, data: any) =>
  api.put(`/data-privacy/dsar/${id}`, data).then(r => r.data);
export const deleteDsarRequest = (id: string) =>
  api.delete(`/data-privacy/dsar/${id}`).then(r => r.data);
