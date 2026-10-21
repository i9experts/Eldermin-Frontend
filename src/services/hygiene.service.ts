import api from '../lib/api';

export interface HygieneItems {
  uniform?: boolean;
  capOrScarf?: boolean;
  shoes?: boolean;
  lunchBrought?: boolean;
}

export interface HygieneCheckRow {
  studentId: string;
  studentName: string;
  grade: string;
  section?: string;
  campusId?: string;
  date: string;
  items: HygieneItems;
  notes?: string;
}

const hygieneService = {
  getClassChecks: async (params: { grade: string; section?: string; date: string }) => {
    const { data } = await api.get('/hygiene/class', { params });
    return data;
  },
  bulkLog: async (records: HygieneCheckRow[]) => {
    const { data } = await api.post('/hygiene/bulk', { records });
    return data;
  },
};

export default hygieneService;
