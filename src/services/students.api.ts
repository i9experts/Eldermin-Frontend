import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/students`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-school-slug'] = localStorage.getItem('schoolSlug') || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

// ── Dashboard ─────────────────────────────────────────────────
export const fetchStudentDashboard = (academicYear?: string) =>
  api.get('/dashboard', { params: { academicYear } }).then(r => r.data);

// ── Students ──────────────────────────────────────────────────
export const fetchStudents = (params?: any) =>
  api.get('/', { params }).then(r => r.data);

export const fetchStudentById = (id: string) =>
  api.get(`/${id}`).then(r => r.data);

export const fetchStudent360 = (id: string) =>
  api.get(`/${id}/360`).then(r => r.data);

export const createStudent = (data: any) =>
  api.post('/', data).then(r => r.data);

export const updateStudent = (id: string, data: any) =>
  api.put(`/${id}`, data).then(r => r.data);

// ── Attendance ────────────────────────────────────────────────
export const fetchAttendance = (params?: any) =>
  api.get('/attendance/list', { params }).then(r => r.data);

export const fetchAttendanceSummary = (studentId: string, month?: string) =>
  api.get(`/${studentId}/attendance/summary`, { params: { month } }).then(r => r.data);

export const markAttendance = (data: any) =>
  api.post('/attendance', data).then(r => r.data);

export const bulkMarkAttendance = (data: any) =>
  api.post('/attendance/bulk', data).then(r => r.data);

// ── Fees ──────────────────────────────────────────────────────
export const fetchFees = (params?: any) =>
  api.get('/fees/list', { params }).then(r => r.data);

export const fetchFeeStatement = (studentId: string) =>
  api.get(`/${studentId}/fees/statement`).then(r => r.data);

export const createFee = (data: any) =>
  api.post('/fees', data).then(r => r.data);

export const collectFee = (id: string, data: any) =>
  api.patch(`/fees/${id}/collect`, data).then(r => r.data);

// ── Behaviour ─────────────────────────────────────────────────
export const fetchBehaviour = (params?: any) =>
  api.get('/behaviour/list', { params }).then(r => r.data);

export const fetchStudentBehaviour = (studentId: string) =>
  api.get(`/${studentId}/behaviour`).then(r => r.data);

export const createBehaviour = (data: any) =>
  api.post('/behaviour', data).then(r => r.data);

export const updateBehaviour = (id: string, data: any) =>
  api.put(`/behaviour/${id}`, data).then(r => r.data);

// ── Results ───────────────────────────────────────────────────
export const fetchStudentResults = (studentId: string) =>
  api.get(`/${studentId}/results`).then(r => r.data);

export const createResult = (data: any) =>
  api.post('/results', data).then(r => r.data);

// ── Reports ───────────────────────────────────────────────────
export const fetchClassReport = (grade: string, section: string, academicYear: string) =>
  api.get('/report/class', { params: { grade, section, academicYear } }).then(r => r.data);
