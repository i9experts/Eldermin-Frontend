import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/procurement`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // schoolSlug here is harmless (backend prioritizes the real JWT value),
  // but academicYear was a genuine live bug - the JWT never carries this
  // field, so the backend fell through entirely to this hardcoded '2025-26'
  // header for every request through this client, permanently, regardless
  // of the real current academic year.
  const inst = safeParseLocalStorage('eldermin_institution');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export const fetchDashboard = () => api.get('/dashboard').then(r => r.data);

export const fetchVendors = (params?: any) => api.get('/vendors', { params }).then(r => r.data);
export const createVendor = (data: any) => api.post('/vendors', data).then(r => r.data);
export const updateVendor = (id: string, data: any) => api.put(`/vendors/${id}`, data).then(r => r.data);

export const fetchPRs = (params?: any) => api.get('/requests', { params }).then(r => r.data);
export const createPR = (data: any) => api.post('/requests', data).then(r => r.data);
export const updatePR = (id: string, data: any) => api.put(`/requests/${id}`, data).then(r => r.data);
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
export const updateInventoryItem = (id: string, data: any) => api.put(`/inventory/${id}`, data).then(r => r.data);
export const deleteInventoryItem = (id: string) => api.delete(`/inventory/${id}`).then(r => r.data);
export const adjustStock = (id: string, data: any) => api.patch(`/inventory/${id}/adjust`, data).then(r => r.data);
export const getInventorySummary = () => api.get('/inventory/summary').then(r => r.data);

export const fetchAssets = (params?: any) => api.get('/assets', { params }).then(r => r.data);
export const createAsset = (data: any) => api.post('/assets', data).then(r => r.data);
export const updateAsset = (id: string, data: any) => api.put(`/assets/${id}`, data).then(r => r.data);
export const deleteAsset = (id: string) => api.delete(`/assets/${id}`).then(r => r.data);

// ─── MASTER SETTINGS ────────────────────────────────────────────────────────
// School-configurable replacements for the old hardcoded VENDOR_CATS/
// ITEM_CATS/ASSET_CATS/UOM_OPTIONS/PAYMENT_TERMS_LIST/DEPRECIATION_METHODS
// arrays in procurement/types.ts. One resource-CRUD set per settings
// endpoint, following the same fetch/create/update/delete shape as Vendors
// above; seedSettingsDefaults seeds all six lists at once (idempotent).
function settingsResource(path: string) {
  return {
    fetch: (params?: any) => api.get(`/settings/${path}`, { params }).then(r => r.data),
    create: (data: any) => api.post(`/settings/${path}`, data).then(r => r.data),
    update: (id: string, data: any) => api.put(`/settings/${path}/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/settings/${path}/${id}`).then(r => r.data),
  };
}

export const vendorCategoriesApi = settingsResource('vendor-categories');
export const itemCategoriesApi = settingsResource('item-categories');
export const assetCategoriesApi = settingsResource('asset-categories');
export const unitsOfMeasureApi = settingsResource('units-of-measure');
export const paymentTermsApi = settingsResource('payment-terms');
export const depreciationMethodsApi = settingsResource('depreciation-methods');

export const seedSettingsDefaults = () => api.post('/settings/seed-defaults', {}).then(r => r.data);

// ─── REPORTS ──────────────────────────────────────────────────────────────
// Real aggregation behind the Procurement → Reports tab (previously the
// "Generate" button just showed a toast and "Schedule" said "Coming soon").
// `key` is one of the 8 report keys below (see ReportKey in reports types),
// matching the backend's ProcurementReportsService route segments exactly.
export type ReportFilterParams = { from?: string; to?: string; campusId?: string };

export const fetchReportData = (key: string, params?: ReportFilterParams) =>
  api.get(`/reports/${key}`, { params }).then(r => r.data);

const EXPORT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};
const EXPORT_EXT: Record<string, string> = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };

/** Fetches the report file and triggers a real browser download — same
 *  Blob + <a download> pattern hr.service.ts's downloadPayslipPdf uses. */
export const downloadReportExport = async (key: string, format: 'pdf' | 'excel' | 'csv', filenameBase: string, params?: ReportFilterParams) => {
  const { data } = await api.get(`/reports/${key}/export`, { params: { ...params, format }, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: EXPORT_MIME[format] }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.${EXPORT_EXT[format]}`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── SCHEDULED REPORTS ──────────────────────────────────────────────────────
export const fetchScheduledReports = (params?: any) => api.get('/scheduled-reports', { params }).then(r => r.data);
export const createScheduledReport = (data: any) => api.post('/scheduled-reports', data).then(r => r.data);
export const updateScheduledReport = (id: string, data: any) => api.put(`/scheduled-reports/${id}`, data).then(r => r.data);
export const deleteScheduledReport = (id: string) => api.delete(`/scheduled-reports/${id}`).then(r => r.data);
export const runScheduledReportNow = (id: string) => api.post(`/scheduled-reports/${id}/run-now`).then(r => r.data);
