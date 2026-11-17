import axios from 'axios';
import { getCurrentAcademicYear } from '../lib/academicYear';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

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
  const inst = safeParseLocalStorage('eldermin_institution');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = getCurrentAcademicYear();
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

export const generateFeeRevenueReportPdf = (payload: { month: string; academicYear?: string; campus?: string }): Promise<Blob> =>
  api.post('/fee-revenue-report', payload, { responseType: 'blob', timeout: 60000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Generic branded "list report" PDF (letterhead + title + table) - any
 * report screen that already builds CSV rows client-side can reuse this
 * for a PDF export instead of a bespoke backend layout per report. */
export const generateTabularReportPdf = (payload: { title: string; subtitle?: string; filterSummary?: string; columns: string[]; rows: (string | number)[][] }): Promise<Blob> =>
  api.post('/tabular-report', payload, { responseType: 'blob', timeout: 60000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateQaidaReportPdf = (payload: { studentId: string; upToTakhti?: number }): Promise<Blob> =>
  api.post('/qaida-report', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Nazra (Qur'an reading) progress PDF - same shape as generateQaidaReportPdf, since Nazra is the same program's next stage after Qaida. */
export const generateNazraReportPdf = (payload: { studentId: string; upToPara?: number }): Promise<Blob> =>
  api.post('/nazra-report', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateTarbiyahReportPdf = (payload: { assessmentId: string }): Promise<Blob> =>
  api.post('/tarbiyah-report', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Guided Reading progress PDF - level, completed readers, points/keywords/badges. */
export const generateGuidedReadingReportPdf = (payload: { studentId: string }): Promise<Blob> =>
  api.post('/guided-reading-report', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateTarbiyahClassReportPdf = (payload: { grade: string; section?: string; period?: string; campusId?: string; category?: string }): Promise<Blob> =>
  api.post('/tarbiyah-class-report', payload, { responseType: 'blob', timeout: 60000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export const generateTarbiyahSchoolReportPdf = (payload: { period?: string; campusId?: string; category?: string }): Promise<Blob> =>
  api.post('/tarbiyah-school-report', payload, { responseType: 'blob', timeout: 60000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Comprehensive, whole-term report card PDF - reads the TermReportCard
 * already generated from Assessments > Results > Whole Term (see
 * AssessmentService.generateTermReportCards); `term` is optional and
 * falls back to the most recently generated term report for that year. */
export const generateReportCardPdf = (payload: { studentId: string; academicYear: string; term?: string }): Promise<Blob> =>
  api.post('/report-card', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Per-exam Report Card PDF (as opposed to generateReportCardPdf above,
 * which is actually the whole-TERM report). Has no published requirement -
 * this is the print/preview path for before Publish Results is clicked,
 * and works just as well after. */
export const generateExamReportCardPdf = (payload: { assessmentId: string; studentId: string }): Promise<Blob> =>
  api.post('/exam-report-card', payload, { responseType: 'blob' }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Every report card matching an assessment (optionally narrowed by the
 * same section/result filters the Results tab's own list applies) as one
 * combined PDF - the "Download All" button, so staff no longer have to
 * click the per-row download once per student. A long timeout since the
 * server renders each student's PDF in turn before merging them. */
export const generateBulkExamReportCardsPdf = (payload: { assessmentId: string; section?: string; result?: string }): Promise<Blob> =>
  api.post('/exam-report-card/bulk', payload, { responseType: 'blob', timeout: 120000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Every whole-term report card matching the Results tab's own Term/Section
 * filters as one combined PDF - the Whole Term view's own "Download All",
 * same convention as generateBulkExamReportCardsPdf above. */
export const generateBulkTermReportCardsPdf = (payload: { term?: string; section?: string }): Promise<Blob> =>
  api.post('/report-card/bulk', payload, { responseType: 'blob', timeout: 120000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

/** Every tracked student's Nazra progress report in a class as one combined
 * PDF - grade/section mirror the Nazra tab's own class roster filters. */
export const generateBulkNazraReportsPdf = (payload: { grade: string; section?: string; upToPara?: number }): Promise<Blob> =>
  api.post('/nazra-report/bulk', payload, { responseType: 'blob', timeout: 120000 }).then(r => new Blob([r.data], { type: 'application/pdf' }));

export default {
  downloadBlob,
  generatePdf,
  generateFeeReceiptPdf,
  generateInvoicePdf,
  generateBulkChallansPdf,
  generateVoucherPdf,
  generateFeeRevenueReportPdf,
  generateTabularReportPdf,
  generateQaidaReportPdf,
  generateNazraReportPdf,
  generateTarbiyahReportPdf,
  generateGuidedReadingReportPdf,
  generateTarbiyahClassReportPdf,
  generateTarbiyahSchoolReportPdf,
  generateReportCardPdf,
  generateExamReportCardPdf,
  generateBulkExamReportCardsPdf,
  generateBulkTermReportCardsPdf,
  generateBulkNazraReportsPdf,
};
