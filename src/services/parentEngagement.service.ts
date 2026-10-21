import api from '../lib/api';

export interface PickupLogRow {
  studentId: string;
  studentName: string;
  grade: string;
  section?: string;
  campusId?: string;
  date: string;
  scheduledPickupTime?: string;
  actualPickupTime?: string;
  markedLate?: boolean;
  notes?: string;
}

const parentEngagementService = {
  getClassScores: async (params: { grade?: string; section?: string; campusId?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/parent-engagement/class', { params });
    return data;
  },
  getScore: async (studentId: string) => {
    const { data } = await api.get(`/parent-engagement/score/${studentId}`);
    return data;
  },
  getPickupLogs: async (params: { grade: string; section?: string; date: string }) => {
    const { data } = await api.get('/parent-engagement/pickup', { params });
    return data;
  },
  bulkLogPickup: async (records: PickupLogRow[]) => {
    const { data } = await api.post('/parent-engagement/pickup/bulk', { records });
    return data;
  },
};

export default parentEngagementService;
