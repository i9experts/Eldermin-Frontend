import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/behaviour/qaida`,
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

export interface QaidaTakhtiDef {
  number: number;
  key: string;
  titleEn: string;
  titleUr: string;
  description: string;
  focus: ('makhraj' | 'tajweed' | 'fluency')[];
  pageReference: string;
  referenceContent?: string[];
  referenceLabels?: string[];
}

export const fetchTakhtis = () =>
  api.get('/takhtis').then(r => r.data as { takhtis: QaidaTakhtiDef[]; total: number });

export const fetchSummary = () =>
  api.get('/summary').then(r => r.data);

export const fetchClassProgress = (grade: string, section?: string, campusId?: string) =>
  api.get('/class', { params: { grade, section, campusId } }).then(r => r.data);

export const fetchProgress = (studentId: string) =>
  api.get(`/students/${studentId}`).then(r => r.data);

export const fetchReport = (studentId: string) =>
  api.get(`/students/${studentId}/report`).then(r => r.data);

export const initProgress = (studentId: string, data: { studentName: string; grade: string; section?: string; campusId?: string }) =>
  api.post(`/students/${studentId}/init`, data).then(r => r.data);

export const recordAttempt = (studentId: string, data: {
  takhtiNumber: number;
  rating: 'needs_practice' | 'developing' | 'proficient' | 'mastered';
  makhrajAccuracy?: number;
  tajweedAccuracy?: number;
  fluency?: number;
  errorsNoted?: string[];
  remarks?: string;
  sabaqFrom?: string;
  sabaqTo?: string;
  date?: string;
}) =>
  api.post(`/students/${studentId}/attempts`, data).then(r => r.data);

export const updateTakhtiStatus = (studentId: string, takhtiNumber: number, status: string) =>
  api.patch(`/students/${studentId}/takhti/${takhtiNumber}`, { status }).then(r => r.data);

export const updateOverallRemarks = (studentId: string, remarks: string) =>
  api.patch(`/students/${studentId}/remarks`, { remarks }).then(r => r.data);
