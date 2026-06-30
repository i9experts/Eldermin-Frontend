import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE}/api/v1/organization`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-school-slug'] = (() => { try { return JSON.parse(localStorage.getItem('eldermin_user')||'{}').schoolSlug || 'demo-school'; } catch { return 'demo-school'; } })();
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export const fetchProfile = () => api.get('/profile').then(r => r.data);
export const updateProfile = (data: any) => api.put('/profile', data).then(r => r.data);
export const fetchOverview = () => api.get('/overview').then(r => r.data);

export const fetchCampuses = () => api.get('/campuses').then(r => r.data);
export const createCampus = (data: any) => api.post('/campuses', data).then(r => r.data);
export const updateCampus = (id: string, data: any) => api.put(`/campuses/${id}`, data).then(r => r.data);
export const deleteCampus = (id: string) => api.delete(`/campuses/${id}`).then(r => r.data);

export const fetchAcademicYears = () => api.get('/academic-years').then(r => r.data);
export const createAcademicYear = (data: any) => api.post('/academic-years', data).then(r => r.data);
export const setCurrentYear = (id: string) => api.patch(`/academic-years/${id}/set-current`).then(r => r.data);

export const fetchGrades = (campusId?: string) =>
  api.get('/grades', { params: campusId ? { campusId } : undefined }).then(r => r.data);
export const createGrade = (data: any) => api.post('/grades', data).then(r => r.data);
export const seedGrades = () => api.post('/grades/seed').then(r => r.data);
export const addSection = (gradeId: string, data: any) => api.post(`/grades/${gradeId}/sections`, data).then(r => r.data);

export const fetchDepartments = () => api.get('/departments').then(r => r.data);
export const createDepartment = (data: any) => api.post('/departments', data).then(r => r.data);
export const updateDepartment = (id: string, data: any) => api.put(`/departments/${id}`, data).then(r => r.data);

export const fetchDesignations = (category?: string) =>
  api.get('/designations', { params: category ? { category } : undefined }).then(r => r.data);
export const createDesignation = (data: any) => api.post('/designations', data).then(r => r.data);
