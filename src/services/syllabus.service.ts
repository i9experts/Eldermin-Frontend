import api from '../lib/api';

const syllabusService = {
  getDashboard: async (academicYear?: string) => {
    const { data } = await api.get('/syllabus/dashboard', { params: academicYear ? { academicYear } : undefined });
    return data;
  },

  getCoverageReport: async (params?: Record<string, any>) => {
    const { data } = await api.get('/syllabus/report/coverage', { params });
    return data;
  },

  getAll: async (params?: Record<string, any>) => {
    const { data } = await api.get('/syllabus', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/syllabus/${id}`);
    return data;
  },

  create: async (payload: Record<string, any>) => {
    const { data } = await api.post('/syllabus', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, any>) => {
    const { data } = await api.put(`/syllabus/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/syllabus/${id}`);
    return data;
  },

  approve: async (id: string, approverName: string) => {
    const { data } = await api.patch(`/syllabus/${id}/approve`, { approverName });
    return data;
  },

  markTopic: async (id: string, payload: { unitNo: number; topicNo: number; isCovered: boolean; coveredBy?: string; actualLessonsUsed?: number; notes?: string }) => {
    const { data } = await api.patch(`/syllabus/${id}/mark-topic`, payload);
    return data;
  },

  markSubTopic: async (id: string, payload: { unitNo: number; topicNo: number; subTopicNo: number; isCovered: boolean; coveredBy?: string; notes?: string }) => {
    const { data } = await api.patch(`/syllabus/${id}/mark-sub-topic`, payload);
    return data;
  },

  getWeeklyPlanner: async (teacherId: string) => {
    const { data } = await api.get('/syllabus/weekly-planner', { params: { teacherId } });
    return data;
  },

  // SLO Templates - reusable, sourced curriculum content. Never
  // auto-applied - the coordinator explicitly picks a matching template
  // to start a new syllabus from, if one exists for that subject/grade.
  listSloTemplates: async (subjectName?: string, gradeLevel?: string, framework?: string) => {
    const { data } = await api.get('/syllabus/slo-templates', { params: { subjectName, gradeLevel, framework } });
    return data;
  },
  getSloTemplate: async (id: string) => {
    const { data } = await api.get(`/syllabus/slo-templates/${id}`);
    return data;
  },

  generatePacingGuide: async (id: string) => {
    const { data } = await api.post(`/syllabus/${id}/generate-pacing-guide`);
    return data;
  },

  recommendAssessmentBreakdown: async (subjectName: string, gradeLevel: string, framework: string) => {
    const { data } = await api.get('/syllabus/recommend-assessment-breakdown', { params: { subjectName, gradeLevel, framework } });
    return data;
  },

  setBehindSchedule: async (id: string, behind: boolean) => {
    const { data } = await api.patch(`/syllabus/${id}/behind-schedule`, { behind });
    return data;
  },
};

export default syllabusService;
