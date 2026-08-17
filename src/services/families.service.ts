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
  getFamily: async (id: string) => {
    const { data } = await api.get(`/families/${id}`);
    return data;
  },
  createFamily: async (payload: any) => {
    const { data } = await api.post('/families', payload);
    return data;
  },
  updateFamily: async (id: string, payload: any) => {
    const { data } = await api.patch(`/families/${id}`, payload);
    return data;
  },
  deleteFamily: async (id: string) => {
    const { data } = await api.delete(`/families/${id}`);
    return data;
  },
  linkStudent: async (familyId: string, studentId: string) => {
    const { data } = await api.post(`/families/${familyId}/link`, { studentId });
    return data;
  },
  unlinkStudent: async (familyId: string, studentId: string) => {
    const { data } = await api.post(`/families/${familyId}/unlink`, { studentId });
    return data;
  },
  verifyFamily: async (id: string) => {
    const { data } = await api.post(`/families/${id}/verify`);
    return data;
  },
  previewRetrofit: async () => {
    const { data } = await api.get('/families/retrofit/preview');
    return data;
  },
  commitRetrofit: async (approvedGroups: any[]) => {
    const { data } = await api.post('/families/retrofit/commit', { approvedGroups });
    return data;
  },
};

export default familiesService;
