import axios from 'axios';

const adm = axios.create({
  baseURL: 'http://93.127.163.238:3001/api/v1/admissions',
  headers: {
    'Content-Type': 'application/json',
    'x-school-slug': 'demo-school',
    'x-academic-year': '2025-26',
  },
  timeout: 15000,
});

adm.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchDashboard = (academicYear?: string) =>
  adm.get('/dashboard', { params: { academicYear } }).then(r => r.data);

export const fetchLeads = (params?: any) =>
  adm.get('/leads', { params }).then(r => r.data);

export const fetchLeadById = (id: string) =>
  adm.get(`/leads/${id}`).then(r => r.data);

export const createLead = (data: any) =>
  adm.post('/leads', data).then(r => r.data);

export const updateLead = (id: string, data: any) =>
  adm.put(`/leads/${id}`, data).then(r => r.data);

export const deleteLead = (id: string) =>
  adm.delete(`/leads/${id}`).then(r => r.data);

export const convertLead = (id: string, data: any) =>
  adm.post(`/leads/${id}/convert`, data).then(r => r.data);

export const fetchApplicants = (params?: any) =>
  adm.get('/applicants', { params }).then(r => r.data);

export const createApplicant = (data: any) =>
  adm.post('/applicants', data).then(r => r.data);

export const updateApplicant = (id: string, data: any) =>
  adm.put(`/applicants/${id}`, data).then(r => r.data);

export const updateDocument = (applicantId: string, documentId: string, status: string, remarks?: string) =>
  adm.patch(`/applicants/${applicantId}/document`, { documentId, status, remarks }).then(r => r.data);

export const fetchTests = (params?: any) =>
  adm.get('/tests', { params }).then(r => r.data);

export const createTest = (data: any) =>
  adm.post('/tests', data).then(r => r.data);

export const submitTestResult = (id: string, data: any) =>
  adm.patch(`/tests/${id}/result`, data).then(r => r.data);

export const fetchInterviews = (params?: any) =>
  adm.get('/interviews', { params }).then(r => r.data);

export const createInterview = (data: any) =>
  adm.post('/interviews', data).then(r => r.data);

export const submitInterviewResult = (id: string, data: any) =>
  adm.patch(`/interviews/${id}/result`, data).then(r => r.data);

export const fetchEnrollments = (params?: any) =>
  adm.get('/enrollments', { params }).then(r => r.data);

export const createEnrollment = (data: any) =>
  adm.post('/enrollments', data).then(r => r.data);

export const updateEnrollment = (id: string, data: any) =>
  adm.put(`/enrollments/${id}`, data).then(r => r.data);

export const fetchRetention = (params?: any) =>
  adm.get('/retention', { params }).then(r => r.data);

export const updateRetention = (id: string, data: any) =>
  adm.put(`/retention/${id}`, data).then(r => r.data);

export const fetchReport = (params: any) =>
  adm.get('/reports', { params }).then(r => r.data);
