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

// Board Members
export const getBoardMembers = () => api.get('/board-members').then(r => r.data);
export const createBoardMember = (data: any) => api.post('/board-members', data).then(r => r.data);
export const updateBoardMember = (id: string, data: any) => api.put(`/board-members/${id}`, data).then(r => r.data);
export const deleteBoardMember = (id: string) => api.delete(`/board-members/${id}`).then(r => r.data);

// Committees
export const getCommittees = () => api.get('/committees').then(r => r.data);
export const createCommittee = (data: any) => api.post('/committees', data).then(r => r.data);
export const updateCommittee = (id: string, data: any) => api.put(`/committees/${id}`, data).then(r => r.data);
export const deleteCommittee = (id: string) => api.delete(`/committees/${id}`).then(r => r.data);

// Meetings
export const getMeetings = (type?: string) => api.get(`/meetings${type ? `?type=${type}` : ''}`).then(r => r.data);
export const createMeeting = (data: any) => api.post('/meetings', data).then(r => r.data);
export const updateMeeting = (id: string, data: any) => api.put(`/meetings/${id}`, data).then(r => r.data);
export const deleteMeeting = (id: string) => api.delete(`/meetings/${id}`).then(r => r.data);

// Workflows
export const getWorkflows = () => api.get('/workflows').then(r => r.data);
export const createWorkflow = (data: any) => api.post('/workflows', data).then(r => r.data);
export const updateWorkflow = (id: string, data: any) => api.put(`/workflows/${id}`, data).then(r => r.data);
export const deleteWorkflow = (id: string) => api.delete(`/workflows/${id}`).then(r => r.data);
