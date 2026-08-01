import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/pdf`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-school-slug'] = (() => { try { return JSON.parse(localStorage.getItem('eldermin_user')||'{}').schoolSlug || 'demo-school'; } catch { return 'demo-school'; } })();
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

export const generateVoucherPdf = (payload: { expenseId?: string; voucherData?: any; templateId?: string; type?: string }): Promise<Blob> =>
  api.post('/voucher', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export default {
  downloadBlob,
  generatePdf,
  generateFeeReceiptPdf,
  generateInvoicePdf,
  generateVoucherPdf,
};
