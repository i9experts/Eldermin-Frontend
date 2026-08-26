import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/report-templates`,
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

export type ReportType =
  | 'fee_receipt' | 'payment_voucher' | 'journal_voucher'
  | 'expense_voucher' | 'payslip' | 'result_card'
  | 'attendance_sheet' | 'admission_letter' | 'contract' | 'timetable' | 'custom';

export interface ReportTemplateSection {
  id: string;
  type: 'table' | 'key_value' | 'text' | 'signature_block' | 'divider' | 'spacer' | 'qr_code';
  order: number;
  visible: boolean;
  config: any;
}

export interface ReportTemplate {
  _id: string;
  schoolSlug: string;
  tenantId?: string;
  name: string;
  type: ReportType;
  isDefault: boolean;
  isActive: boolean;
  letterhead: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    logoSize: 'small' | 'medium' | 'large';
    schoolName: { show: boolean; fontSize: number; bold: boolean; color: string };
    schoolAddress: { show: boolean; fontSize: number };
    schoolPhone: { show: boolean };
    schoolEmail: { show: boolean };
    schoolWebsite: { show: boolean };
    tagline: { show: boolean; text: string };
    borderStyle: 'none' | 'single' | 'double' | 'shadow';
    backgroundColor: string;
    primaryColor: string;
    accentColor: string;
  };
  header: {
    title: { show: boolean; text: string; fontSize: number; alignment: 'left' | 'center' | 'right' };
    subtitle: { show: boolean; text: string };
    showDocumentNumber: boolean;
    showDate: boolean;
    showAcademicYear: boolean;
    customFields: { label: string; field: string; position: 'left' | 'right' }[];
  };
  sections: ReportTemplateSection[];
  footer: {
    showPageNumber: boolean;
    showPrintDate: boolean;
    leftText: string;
    centerText: string;
    rightText: string;
    showSignatureLines: boolean;
    signatureLabels: string[];
    showStampArea: boolean;
    borderTop: boolean;
  };
  page: {
    size: 'A4' | 'A5' | 'Letter' | 'custom';
    orientation: 'portrait' | 'landscape';
    marginTop: number; marginBottom: number; marginLeft: number; marginRight: number;
    watermark: { show: boolean; text: string; opacity: number };
  };
  createdAt?: string;
  updatedAt?: string;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  fee_receipt: 'Fee Receipt',
  payment_voucher: 'Payment Voucher',
  journal_voucher: 'Journal Voucher',
  expense_voucher: 'Expense Voucher',
  payslip: 'Payslip',
  result_card: 'Result Card',
  attendance_sheet: 'Attendance Sheet',
  admission_letter: 'Admission Letter',
  contract: 'Employment Contract',
  timetable: 'Class Timetable',
  custom: 'Custom',
};

export const fetchTemplates = (): Promise<ReportTemplate[]> => api.get('/').then(r => r.data);

export const fetchDefaultForType = (type: string): Promise<ReportTemplate> => api.get(`/${type}`).then(r => r.data);

export const createTemplate = (data: Partial<ReportTemplate>): Promise<ReportTemplate> => api.post('/', data).then(r => r.data);

export const updateTemplate = (id: string, data: Partial<ReportTemplate>): Promise<ReportTemplate> => api.put(`/${id}`, data).then(r => r.data);

export const deleteTemplate = (id: string): Promise<void> => api.delete(`/${id}`).then(r => r.data);

export const setDefaultTemplate = (id: string): Promise<ReportTemplate> => api.post(`/${id}/default`).then(r => r.data);

export const duplicateTemplate = (id: string): Promise<ReportTemplate> => api.post(`/${id}/duplicate`).then(r => r.data);

/** Requests a rendered PDF preview for the template and returns a blob object URL the caller can open/embed. */
export const previewTemplate = (id: string): Promise<string> =>
  api.post(`/${id}/preview`, {}, { responseType: 'blob' }).then(r => {
    const blob = new Blob([r.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  });

export default {
  fetchTemplates,
  fetchDefaultForType,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  duplicateTemplate,
  previewTemplate,
  REPORT_TYPE_LABELS,
};
