import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/assessments`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // schoolSlug is technically harmless dead weight here (the backend's ctx()
  // prioritizes the real JWT value first), but academicYear was a genuine,
  // live bug: the JWT never carries an academicYear field at all, so the
  // backend fell through entirely to whatever this header said - and it
  // was hardcoded to the literal string '2025-26', permanently, for every
  // assessment/question/mark ever created through this client.
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
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

export const classifyBloomsLevel = (data: { questionText: string; questionType: string; options?: string[] }) =>
  api.post('/questions/ai-classify-blooms', data).then(r => r.data);

export const fetchExamPapers = (params?: any) =>
  api.get('/papers', { params }).then(r => r.data);

export const fetchExamPaperById = (id: string) =>
  api.get(`/papers/${id}`).then(r => r.data);

export const createExamPaper = (data: any) =>
  api.post('/papers', data).then(r => r.data);

export const updateExamPaper = (id: string, data: any) =>
  api.put(`/papers/${id}`, data).then(r => r.data);

export const deleteExamPaper = (id: string) =>
  api.delete(`/papers/${id}`).then(r => r.data);

export function downloadExamPaperPdf(id: string, title: string) {
  return api.get(`/papers/${id}/pdf`, { responseType: 'blob' }).then((res) => {
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ── OMR ─────────────────────────────────────────────────────────────────────
export const generateOMRSheets = (examPaperId: string, studentIds: string[]) =>
  api.post('/omr/sheets', { examPaperId, studentIds }).then(r => r.data);

export const getOMRSheets = (examPaperId: string) =>
  api.get('/omr/sheets', { params: { examPaperId } }).then(r => r.data);

export function downloadOMRSheetPdf(id: string, studentName: string) {
  return api.get(`/omr/sheets/${id}/pdf`, { responseType: 'blob' }).then((res) => {
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omr-${studentName.replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export const uploadOMRSheetPhoto = (id: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/omr/sheets/${id}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const confirmOMRSheet = (id: string, answers: { questionNumber: number; confirmedOption?: string }[]) =>
  api.post(`/omr/sheets/${id}/confirm`, { answers }).then(r => r.data);

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
