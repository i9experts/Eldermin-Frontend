import api from '../lib/api';

const teachingService = {
  getDashboard: async () => { const { data } = await api.get('/teaching/dashboard'); return data; },

  getTeachers: async () => { const { data } = await api.get('/teaching/teachers'); return data; },
  createTeacher: async (payload: any) => { const { data } = await api.post('/teaching/teachers', payload); return data; },
  updateTeacher: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/teachers/${id}`, payload); return data; },
  syncTeachers: async () => { const { data } = await api.post('/teaching/teachers/sync', {}); return data; },

  getLessonPlans: async (params?: any) => { const { data } = await api.get('/teaching/lesson-plans', { params }); return data; },
  createLessonPlan: async (payload: any) => { const { data } = await api.post('/teaching/lesson-plans', payload); return data; },
  updateLessonPlan: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/lesson-plans/${id}`, payload); return data; },
  approveLessonPlan: async (id: string, notes: string) => { const { data } = await api.patch(`/teaching/lesson-plans/${id}/approve`, { notes }); return data; },
  rejectLessonPlan: async (id: string, reason: string) => { const { data } = await api.patch(`/teaching/lesson-plans/${id}/reject`, { reason }); return data; },

  getTimetables: async (params?: any) => { const { data } = await api.get('/teaching/timetable', { params }); return data; },
  createTimetable: async (payload: any) => { const { data } = await api.post('/teaching/timetable', payload); return data; },
  updateTimetable: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/timetable/${id}`, payload); return data; },

  // Syllabus has moved to its own dedicated service (syllabus.service.ts) -
  // the unified module used by both Academics and Teaching Management.

  getAssignments: async (params?: any) => { const { data } = await api.get('/teaching/assignments', { params }); return data; },
  createAssignment: async (payload: any) => { const { data } = await api.post('/teaching/assignments', payload); return data; },
  updateAssignment: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/assignments/${id}`, payload); return data; },

  getBehaviourNotes: async (params?: any) => { const { data } = await api.get('/teaching/behaviour', { params }); return data; },
  createBehaviourNote: async (payload: any) => { const { data } = await api.post('/teaching/behaviour', payload); return data; },
  updateBehaviourNote: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/behaviour/${id}`, payload); return data; },
};

export default teachingService;
