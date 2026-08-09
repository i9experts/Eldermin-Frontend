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

  setBehindSchedule: async (id: string, behind: boolean) => {
    const { data } = await api.patch(`/syllabus/${id}/behind-schedule`, { behind });
    return data;
  },
};

export default syllabusService;
