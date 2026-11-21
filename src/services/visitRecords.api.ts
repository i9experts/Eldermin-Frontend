import axios from 'axios';

// Internal sales CRM - Eldermin's own field reps logging institution site
// visits (lead qualification for Eldermin + SmartVan), not scoped to any
// school tenant. Same client shape as leads.api.ts (the other company-
// internal CRM collection) - own axios instance rather than lib/api.ts's
// shared client, since neither x-school-slug nor x-academic-year mean
// anything for this data.
const visitRecords = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/visit-records`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

visitRecords.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface VisitRecordLocation {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export interface VisitRecordPayload {
  visitDate?: string;
  institutionName: string;
  institutionType: string;
  city?: string;
  area?: string;
  location?: VisitRecordLocation | null;
  photoUrl?: string;
  feeTier?: string;
  campusCount?: string;
  studentCount?: string;
  staffCount?: string;
  contactName?: string;
  contactRole?: string;
  whatsapp?: string;
  whatsappOk?: boolean;
  bestTimeToContact?: string[];
  email?: string;
  socialOrWebsite?: string;
  currentSystem?: string;
  currentSystemName?: string;
  transportStatus?: string;
  transportTrackingMethod?: string;
  feeConcessionPlans?: string;
  admissionSeasons?: string[];
  elderminInterest?: string;
  smartvanInterest?: string;
  biggestProblem?: string;
  notes?: string;
  nextFollowUpDate?: string | null;
  followUpDone?: boolean;
}

export const getVisitRecords = (params?: {
  institutionType?: string; elderminInterest?: string; smartvanInterest?: string;
  pendingFollowUp?: boolean; search?: string;
}) => visitRecords.get('/', { params }).then(r => r.data);

export const getVisitRecordStats = () =>
  visitRecords.get('/stats').then(r => r.data);

export const getVisitRecord = (id: string) =>
  visitRecords.get(`/${id}`).then(r => r.data);

export const createVisitRecord = (data: VisitRecordPayload) =>
  visitRecords.post('/', data).then(r => r.data);

export const updateVisitRecord = (id: string, data: Partial<VisitRecordPayload>) =>
  visitRecords.patch(`/${id}`, data).then(r => r.data);

export const uploadVisitRecordPhoto = (id: string, file: File) => {
  const form = new FormData();
  form.append('photo', file);
  return visitRecords.post(`/${id}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }).then(r => r.data);
};

export const addVisitRecordFollowUpNote = (id: string, text: string) =>
  visitRecords.post(`/${id}/follow-up-notes`, { text }).then(r => r.data);

export const deleteVisitRecord = (id: string) =>
  visitRecords.delete(`/${id}`).then(r => r.data);
