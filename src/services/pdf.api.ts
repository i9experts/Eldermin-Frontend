import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/pdf`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Was reading localStorage['eldermin_user'].schoolSlug — that key/field
  // never existed (the real school slug lives in eldermin_institution.slug),
  // so this always silently fell back to the hardcoded 'demo-school' string
  // for every user, tripping the backend's SchoolGuard the moment a real
  // (non-demo) user's JWT didn't match that fake header value.
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

/** Triggers a browser download of a blob without navigating away from the page. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const generatePdf = (payload: { templateId?: string; type: string; data: any }): Promise<Blob> =>
  api.post('/generate', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateFeeReceiptPdf = (payload: { paymentId: string; templateId?: string }): Promise<Blob> =>
  api.post('/fee-receipt', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateInvoicePdf = (payload: { invoiceId: string }): Promise<Blob> =>
  api.post('/invoice', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateBulkChallansPdf = (payload: { month: string; academicYear?: string; scopeType?: string; scopeValue?: string }): Promise<Blob> =>
  api.post('/challans/bulk', payload, { responseType: 'blob', timeout: 60000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateVoucherPdf = (payload: { expenseId?: string; voucherData?: any; templateId?: string; type?: string }): Promise<Blob> =>
  api.post('/voucher', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export default {
  downloadBlob,
  generatePdf,
  generateFeeReceiptPdf,
  generateInvoicePdf,
  generateBulkChallansPdf,
  generateVoucherPdf,
};
