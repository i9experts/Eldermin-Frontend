import axios from 'axios';
import { safeParseLocalStorage } from '../lib/safeParseLocalStorage';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/behaviour/nazra`,
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

export interface NazraParaDef {
  number: number;
  titleEn: string;
  titleAr: string;
  approxPageRange: string;
}

export type NazraRating = 'needs_practice' | 'developing' | 'proficient' | 'mastered';

export interface DiarySabaqInput {
  paraNumber: number;
  pageFrom?: string;
  pageTo?: string;
  rating: NazraRating;
  makhrajAccuracy?: number;
  tajweedAccuracy?: number;
  fluency?: number;
  errorsNoted?: string[];
  remarks?: string;
}

export interface DiaryRevisionInput {
  paraNumber: number;
  pageFrom?: string;
  pageTo?: string;
  rating: NazraRating;
  errorsNoted?: string[];
  remarks?: string;
}

export interface RecordDiaryInput {
  date?: string;
  sabaq: DiarySabaqInput;
  sabqi?: DiaryRevisionInput;
  manzil?: DiaryRevisionInput;
}

export const fetchParas = () =>
  api.get('/paras').then(r => r.data as { paras: NazraParaDef[]; total: number });

export const fetchSummary = () =>
  api.get('/summary').then(r => r.data);

export const fetchClassProgress = (grade: string, section?: string, campusId?: string) =>
  api.get('/class', { params: { grade, section, campusId } }).then(r => r.data);

export const fetchProgress = (studentId: string) =>
  api.get(`/students/${studentId}`).then(r => r.data);

export const fetchReport = (studentId: string) =>
  api.get(`/students/${studentId}/report`).then(r => r.data);

export const initProgress = (studentId: string, data: {
  studentName: string; grade: string; section?: string; campusId?: string;
  // Mirrors qaida.api.ts's initProgress - see NazraProgress.recordType.
  recordType?: 'full_history' | 'joined_later';
  priorRecordNote?: string;
  startAtPara?: number;
}) =>
  api.post(`/students/${studentId}/init`, data).then(r => r.data);

export const recordDiaryEntry = (studentId: string, data: RecordDiaryInput) =>
  api.post(`/students/${studentId}/diary`, data).then(r => r.data);

export const updateParaStatus = (studentId: string, paraNumber: number, status: string) =>
  api.patch(`/students/${studentId}/para/${paraNumber}`, { status }).then(r => r.data);

export const updateOverallRemarks = (studentId: string, remarks: string) =>
  api.patch(`/students/${studentId}/remarks`, { remarks }).then(r => r.data);
