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

  // Rooms
  getRooms: async (campusId?: string) => { const { data } = await api.get('/teaching/rooms', { params: campusId ? { campusId } : undefined }); return data; },
  createRoom: async (payload: any) => { const { data } = await api.post('/teaching/rooms', payload); return data; },
  updateRoom: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/rooms/${id}`, payload); return data; },
  deleteRoom: async (id: string) => { const { data } = await api.delete(`/teaching/rooms/${id}`); return data; },

  // Period Templates
  getPeriodTemplates: async () => { const { data } = await api.get('/teaching/period-templates'); return data; },
  createPeriodTemplate: async (payload: any) => { const { data } = await api.post('/teaching/period-templates', payload); return data; },
  seedDefaultPeriodTemplate: async () => { const { data } = await api.post('/teaching/period-templates/seed-default'); return data; },
  updatePeriodTemplate: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/period-templates/${id}`, payload); return data; },
  deletePeriodTemplate: async (id: string) => { const { data } = await api.delete(`/teaching/period-templates/${id}`); return data; },

  // Syllabus has moved to its own dedicated service (syllabus.service.ts) -
  // the unified module used by both Academics and Teaching Management.

  getAssignments: async (params?: any) => { const { data } = await api.get('/teaching/assignments', { params }); return data; },
  createAssignment: async (payload: any) => { const { data } = await api.post('/teaching/assignments', payload); return data; },
  updateAssignment: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/assignments/${id}`, payload); return data; },

  getBehaviourNotes: async (params?: any) => { const { data } = await api.get('/teaching/behaviour', { params }); return data; },
  createBehaviourNote: async (payload: any) => { const { data } = await api.post('/teaching/behaviour', payload); return data; },
  updateBehaviourNote: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/behaviour/${id}`, payload); return data; },

  // Substitution / Fixture Management
  generateFixturesForAbsence: async (payload: { teacherId: string; date: string; reason?: string }) => {
    const { data } = await api.post('/teaching/fixtures/generate-for-absence', payload);
    return data;
  },
  getFixtures: async (params?: any) => { const { data } = await api.get('/teaching/fixtures', { params }); return data; },
  getFixtureSuggestions: async (fixtureId: string) => { const { data } = await api.get(`/teaching/fixtures/${fixtureId}/suggestions`); return data; },
  assignFixture: async (fixtureId: string, substituteTeacherId: string) => {
    const { data } = await api.post(`/teaching/fixtures/${fixtureId}/assign`, { substituteTeacherId });
    return data;
  },
  cancelFixture: async (fixtureId: string) => { const { data } = await api.patch(`/teaching/fixtures/${fixtureId}/cancel`); return data; },
  completeFixture: async (fixtureId: string) => { const { data } = await api.patch(`/teaching/fixtures/${fixtureId}/complete`); return data; },
  getLessonShortfall: async (params?: any) => { const { data } = await api.get('/teaching/fixtures/reports/lesson-shortfall', { params }); return data; },
  getTeacherWiseFixtureReport: async (params?: any) => { const { data } = await api.get('/teaching/fixtures/reports/teacher-wise', { params }); return data; },
};

export default teachingService;
