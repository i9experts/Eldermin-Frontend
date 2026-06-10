import api from '../lib/api';

const academicsService = {
  getDashboard: async () => { const { data } = await api.get('/academics/dashboard'); return data; },

  // Subjects
  getSubjects: async (params?: any) => { const { data } = await api.get('/academics/subjects', { params }); return data; },
  createSubject: async (payload: any) => { const { data } = await api.post('/academics/subjects', payload); return data; },
  updateSubject: async (id: string, payload: any) => { const { data } = await api.patch(`/academics/subjects/${id}`, payload); return data; },
  seedDefaultSubjects: async () => { const { data } = await api.post('/academics/subjects/seed-defaults', {}); return data; },

  // Curriculum
  getCurricula: async (params?: any) => { const { data } = await api.get('/academics/curriculum', { params }); return data; },
  createCurriculum: async (payload: any) => { const { data } = await api.post('/academics/curriculum', payload); return data; },
  updateCurriculum: async (id: string, payload: any) => { const { data } = await api.patch(`/academics/curriculum/${id}`, payload); return data; },
  addSLO: async (id: string, payload: any) => { const { data } = await api.post(`/academics/curriculum/${id}/slo`, payload); return data; },

  // Syllabus
  getSyllabi: async (params?: any) => { const { data } = await api.get('/academics/syllabus', { params }); return data; },
  createSyllabus: async (payload: any) => { const { data } = await api.post('/academics/syllabus', payload); return data; },
  updateSyllabus: async (id: string, payload: any) => { const { data } = await api.patch(`/academics/syllabus/${id}`, payload); return data; },
  addUnit: async (id: string, payload: any) => { const { data } = await api.post(`/academics/syllabus/${id}/unit`, payload); return data; },
  approveSyllabus: async (id: string, approverName: string) => { const { data } = await api.patch(`/academics/syllabus/${id}/approve`, { approverName }); return data; },

  // Library
  getLibraryStats: async () => { const { data } = await api.get('/academics/library/stats'); return data; },
  getBooks: async (params?: any) => { const { data } = await api.get('/academics/library/books', { params }); return data; },
  createBook: async (payload: any) => { const { data } = await api.post('/academics/library/books', payload); return data; },
  updateBook: async (id: string, payload: any) => { const { data } = await api.patch(`/academics/library/books/${id}`, payload); return data; },
  getBookById: async (id: string) => { const { data } = await api.get(`/academics/library/books/${id}`); return data; },
  issueBook: async (payload: any) => { const { data } = await api.post('/academics/library/issue', payload); return data; },
  returnBook: async (issueId: string, payload: any) => { const { data } = await api.patch(`/academics/library/return/${issueId}`, payload); return data; },
  getIssues: async (params?: any) => { const { data } = await api.get('/academics/library/issues', { params }); return data; },
  getOverdueIssues: async () => { const { data } = await api.get('/academics/library/overdue'); return data; },
  searchBooks: async (q: string) => { const { data } = await api.get('/academics/library/search', { params: { q } }); return data; },
};

export default academicsService;
