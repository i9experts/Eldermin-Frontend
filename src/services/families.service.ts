import api from '../lib/api';

const familiesService = {
  searchByGuardian: async (query: string) => {
    const { data } = await api.get('/families/search-by-guardian', { params: { query } });
    return data;
  },
  getFamilies: async (search?: string, verifiedOnly?: boolean) => {
    const { data } = await api.get('/families', { params: { search, verifiedOnly } });
    return data;
  },
  createFamily: async (payload: any) => {
    const { data } = await api.post('/families', payload);
    return data;
  },
  linkStudent: async (familyId: string, studentId: string) => {
    const { data } = await api.post(`/families/${familyId}/link`, { studentId });
    return data;
  },
};

export default familiesService;
