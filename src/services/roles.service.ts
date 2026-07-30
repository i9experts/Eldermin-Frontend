import api from '../lib/api';

const rolesService = {
  getRoles: async () => {
    const { data } = await api.get('/roles');
    return data;
  },
  getUsers: async () => {
    const { data } = await api.get('/roles/users');
    return data;
  },
  getAssignableModules: async () => {
    const { data } = await api.get('/roles/modules');
    return data;
  },
  createRole: async (payload: any) => {
    const { data } = await api.post('/roles', payload);
    return data;
  },
  updateRole: async (id: string, payload: any) => {
    const { data } = await api.put(`/roles/${id}`, payload);
    return data;
  },
  duplicateRole: async (id: string) => {
    const { data } = await api.post(`/roles/${id}/duplicate`);
    return data;
  },
  deleteRole: async (id: string) => {
    const { data } = await api.delete(`/roles/${id}`);
    return data;
  },
  assignRole: async (userId: string, roleId: string | null) => {
    const { data } = await api.post('/roles/assign', { userId, roleId });
    return data;
  },
};

export default rolesService;
