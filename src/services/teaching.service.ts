import api from '../lib/api';

const teachingService = {
  getDashboard: async () => { const { data } = await api.get('/teaching/dashboard'); return data; },

  getTeachers: async () => { const { data } = await api.get('/teaching/teachers'); return data; },
  createTeacher: async (payload: any) => { const { data } = await api.post('/teaching/teachers', payload); return data; },
  updateTeacher: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/teachers/${id}`, payload); return data; },
  deleteTeacher: async (id: string) => { const { data } = await api.delete(`/teaching/teachers/${id}`); return data; },
  syncTeachers: async () => { const { data } = await api.post('/teaching/teachers/sync', {}); return data; },

  getLessonPlans: async (params?: any) => { const { data } = await api.get('/teaching/lesson-plans', { params }); return data; },
  createLessonPlan: async (payload: any) => { const { data } = await api.post('/teaching/lesson-plans', payload); return data; },
  updateLessonPlan: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/lesson-plans/${id}`, payload); return data; },
  approveLessonPlan: async (id: string, notes: string) => { const { data } = await api.patch(`/teaching/lesson-plans/${id}/approve`, { notes }); return data; },
  rejectLessonPlan: async (id: string, reason: string) => { const { data } = await api.patch(`/teaching/lesson-plans/${id}/reject`, { reason }); return data; },

  getTimetables: async (params?: any) => { const { data } = await api.get('/teaching/timetable', { params }); return data; },
  createTimetable: async (payload: any) => { const { data } = await api.post('/teaching/timetable', payload); return data; },
  updateTimetable: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/timetable/${id}`, payload); return data; },
  deleteTimetable: async (id: string) => { const { data } = await api.delete(`/teaching/timetable/${id}`); return data; },
  downloadTimetablePdf: async (id: string, filename: string, templateId?: string, week?: 'A' | 'B') => {
    const params: any = {};
    if (templateId) params.templateId = templateId;
    if (week) params.week = week;
    const { data } = await api.get(`/teaching/timetable/${id}/pdf`, { params: Object.keys(params).length ? params : undefined, responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },

  // Elective / cross-class groups
  getElectiveGroups: async (params?: any) => { const { data } = await api.get('/teaching/electives', { params }); return data; },
  createElectiveGroup: async (payload: any) => { const { data } = await api.post('/teaching/electives', payload); return data; },
  updateElectiveGroup: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/electives/${id}`, payload); return data; },
  deleteElectiveGroup: async (id: string) => { const { data } = await api.delete(`/teaching/electives/${id}`); return data; },

  // Duty roster
  getDutyRoster: async (params?: any) => { const { data } = await api.get('/teaching/duty-roster', { params }); return data; },
  createDutyRoster: async (payload: any) => { const { data } = await api.post('/teaching/duty-roster', payload); return data; },
  updateDutyRoster: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/duty-roster/${id}`, payload); return data; },
  deleteDutyRoster: async (id: string) => { const { data } = await api.delete(`/teaching/duty-roster/${id}`); return data; },

  // Whole-School Optimizer: timetable variants
  generateTimetableVariants: async (timetableIds: string[], variantCount?: number) => {
    const { data } = await api.post('/teaching/timetable-variants/generate', { timetableIds, variantCount });
    return data;
  },
  getTimetableVariants: async (params?: any) => { const { data } = await api.get('/teaching/timetable-variants', { params }); return data; },
  getTimetableVariant: async (id: string) => { const { data } = await api.get(`/teaching/timetable-variants/${id}`); return data; },
  publishTimetableVariant: async (id: string) => { const { data } = await api.post(`/teaching/timetable-variants/${id}/publish`); return data; },
  deleteTimetableVariant: async (id: string) => { const { data } = await api.delete(`/teaching/timetable-variants/${id}`); return data; },

  // Exam timetabling
  getExams: async (params?: any) => { const { data } = await api.get('/teaching/exams', { params }); return data; },
  createExam: async (payload: any) => { const { data } = await api.post('/teaching/exams', payload); return data; },
  updateExam: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/exams/${id}`, payload); return data; },
  deleteExam: async (id: string) => { const { data } = await api.delete(`/teaching/exams/${id}`); return data; },

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

  // Parent-Teacher Meetings (PTM)
  getPTMDashboard: async () => { const { data } = await api.get('/teaching/ptm/dashboard'); return data; },
  getPTMMeetings: async (params?: any) => { const { data } = await api.get('/teaching/ptm', { params }); return data; },
  getStudentPTMHistory: async (studentId: string) => { const { data } = await api.get(`/teaching/ptm/student/${studentId}/history`); return data; },
  createPTMMeeting: async (payload: any) => { const { data } = await api.post('/teaching/ptm', payload); return data; },
  confirmPTMMeeting: async (id: string) => { const { data } = await api.patch(`/teaching/ptm/${id}/confirm`); return data; },
  reschedulePTMMeeting: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/ptm/${id}/reschedule`, payload); return data; },
  recordPTMOutcome: async (id: string, payload: any) => { const { data } = await api.patch(`/teaching/ptm/${id}/outcome`, payload); return data; },
  updatePTMActionItem: async (id: string, actionItemId: string, status: 'pending' | 'done') => {
    const { data } = await api.patch(`/teaching/ptm/${id}/action-items/${actionItemId}`, { status });
    return data;
  },
  cancelPTMMeeting: async (id: string, reason: string) => { const { data } = await api.patch(`/teaching/ptm/${id}/cancel`, { reason }); return data; },
};

export default teachingService;
