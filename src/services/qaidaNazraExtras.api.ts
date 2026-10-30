import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/behaviour/qaida-nazra`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const inst = safeParseLocalStorage('eldermin_institution');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export interface InvigilatorKpi {
  key: string;
  label: string;
  labelUrdu?: string;
}

export interface QaidaNazraSettings {
  schoolSlug: string;
  nazraReverseOrder: boolean;
  invigilatorKpis: InvigilatorKpi[];
  invigilatorRatingScale: { min: number; max: number; labels: string[] };
}

export const fetchSettings = () =>
  api.get('/settings').then(r => r.data as QaidaNazraSettings);

export const updateSettings = (data: Partial<QaidaNazraSettings>) =>
  api.patch('/settings', data).then(r => r.data as QaidaNazraSettings);

export interface InvigilatorAssessmentEntry {
  studentId: string;
  takhtiOrParaNumber?: number;
  scores: { key: string; score: number; remarks?: string }[];
  overallRemarks?: string;
}

export const recordInvigilatorAssessments = (data: {
  program: 'qaida' | 'nazra';
  visitDate?: string;
  invigilatorType: 'internal' | 'external';
  invigilatorStaffId?: string;
  invigilatorName: string;
  invigilatorOrganization?: string;
  entries: InvigilatorAssessmentEntry[];
}) =>
  api.post('/invigilator-assessments', data).then(r => r.data);

export const fetchInvigilatorAssessments = (studentId: string, program?: 'qaida' | 'nazra') =>
  api.get(`/students/${studentId}/invigilator-assessments`, { params: { program } }).then(r => r.data);

export const fetchHomeLog = (studentId: string, program?: 'qaida' | 'nazra') =>
  api.get(`/students/${studentId}/home-log`, { params: { program } }).then(r => r.data);
