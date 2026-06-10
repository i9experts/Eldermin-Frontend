import axios from 'axios';

const api = axios.create({
  baseURL: 'http://93.127.163.238:3001/api/v1/assessments',
  headers: {
    'Content-Type': 'application/json',
    'x-school-slug': 'demo-school',
    'x-academic-year': '2025-26',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchDashboard = (academicYear?: string) =>
  api.get('/dashboard', { params: { academicYear } }).then(r => r.data);

export const fetchAssessments = (params?: any) =>
  api.get('', { params }).then(r => r.data);

export const fetchAssessmentById = (id: string) =>
  api.get(`/${id}`).then(r => r.data);

export const createAssessment = (data: any) =>
  api.post('', data).then(r => r.data);

export const updateAssessment = (id: string, data: any) =>
  api.put(`/${id}`, data).then(r => r.data);

export const updateAssessmentStatus = (id: string, status: string) =>
  api.patch(`/${id}/status`, { status }).then(r => r.data);

export const fetchQuestions = (params?: any) =>
  api.get('/questions/list', { params }).then(r => r.data);

export const fetchQuestionStats = (subject?: string, grade?: string) =>
  api.get('/questions/stats', { params: { subject, grade } }).then(r => r.data);

export const createQuestion = (data: any) =>
  api.post('/questions', data).then(r => r.data);

export const deleteQuestion = (id: string) =>
  api.delete(`/questions/${id}`).then(r => r.data);

export const fetchMarks = (params?: any) =>
  api.get('/marks/list', { params }).then(r => r.data);

export const fetchMarkSheetSummary = (params?: any) =>
  api.get('/marks/summary', { params }).then(r => r.data);

export const bulkEnterMarks = (data: any) =>
  api.post('/marks/bulk', data).then(r => r.data);

export const verifyMarks = (data: any) =>
  api.patch('/marks/verify', data).then(r => r.data);

export const fetchReportCards = (params?: any) =>
  api.get('/report-cards', { params }).then(r => r.data);

export const fetchStudentReportCard = (assessmentId: string, studentId: string) =>
  api.get(`/report-cards/${assessmentId}/${studentId}`).then(r => r.data);

export const generateReportCards = (data: any) =>
  api.post('/report-cards/generate', data).then(r => r.data);

export const updateReportCardRemarks = (id: string, data: any) =>
  api.patch(`/report-cards/${id}/remarks`, data).then(r => r.data);

export const publishResults = (data: any) =>
  api.post('/report-cards/publish', data).then(r => r.data);

export const fetchAnalytics = (academicYear: string, grade?: string) =>
  api.get('/analytics/performance', { params: { academicYear, grade } }).then(r => r.data);
