import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/behaviour`,
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
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export const fetchDashboard = (academicYear?: string) =>
  api.get('/dashboard', { params: { academicYear } }).then(r => r.data);

export const fetchRecords = (params?: any) =>
  api.get('/records', { params }).then(r => r.data);

export const createRecord = (data: any) =>
  api.post('/records', data).then(r => r.data);

export const updateRecord = (id: string, data: any) =>
  api.put(`/records/${id}`, data).then(r => r.data);

export const resolveRecord = (id: string, note: string) =>
  api.patch(`/records/${id}/resolve`, { note }).then(r => r.data);

export const fetchTarbiyah = (params?: any) =>
  api.get('/tarbiyah', { params }).then(r => r.data);

export const createTarbiyah = (data: any) =>
  api.post('/tarbiyah', data).then(r => r.data);

export const updateTarbiyah = (id: string, data: any) =>
  api.put(`/tarbiyah/${id}`, data).then(r => r.data);

export const getCharacterSettings = () =>
  api.get('/character-settings').then(r => r.data);

export const updateCharacterSettings = (data: any) =>
  api.put('/character-settings', data).then(r => r.data);

export const fetchCounselling = (params?: any) =>
  api.get('/counselling', { params }).then(r => r.data);

export const createSession = (data: any) =>
  api.post('/counselling', data).then(r => r.data);

export const completeSession = (id: string, data: any) =>
  api.patch(`/counselling/${id}/complete`, data).then(r => r.data);

export const fetchInterventions = (params?: any) =>
  api.get('/interventions', { params }).then(r => r.data);

export const createIntervention = (data: any) =>
  api.post('/interventions', data).then(r => r.data);

export const addProgress = (id: string, note: string) =>
  api.post(`/interventions/${id}/progress`, { note }).then(r => r.data);

export const fetchContracts = (params?: any) =>
  api.get('/contracts', { params }).then(r => r.data);

export const createContract = (data: any) =>
  api.post('/contracts', data).then(r => r.data);

export const signContract = (id: string, signedBy: string) =>
  api.patch(`/contracts/${id}/sign`, { signedBy }).then(r => r.data);

export const fetchReport = (params?: any) =>
  api.get('/reports', { params }).then(r => r.data);

export const fetchStudentProfile = (studentId: string, academicYear?: string) =>
  api.get(`/students/${studentId}/profile`, { params: { academicYear } }).then(r => r.data);
