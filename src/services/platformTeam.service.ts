import api from '../lib/api';

const platformTeamService = {
  getTabs: async () => {
    const { data } = await api.get('/super-admin/team/tabs');
    return data;
  },
  getRoles: async () => {
    const { data } = await api.get('/super-admin/team/roles');
    return data;
  },
  createRole: async (payload: any) => {
    const { data } = await api.post('/super-admin/team/roles', payload);
    return data;
  },
  updateRole: async (id: string, payload: any) => {
    const { data } = await api.put(`/super-admin/team/roles/${id}`, payload);
    return data;
  },
  duplicateRole: async (id: string) => {
    const { data } = await api.post(`/super-admin/team/roles/${id}/duplicate`);
    return data;
  },
  deleteRole: async (id: string) => {
    const { data } = await api.delete(`/super-admin/team/roles/${id}`);
    return data;
  },
  assignRole: async (userId: string, roleId: string | null) => {
    const { data } = await api.post('/super-admin/team/assign', { userId, roleId });
    return data;
  },
  getStaff: async () => {
    const { data } = await api.get('/super-admin/team/staff');
    return data;
  },
  createStaff: async (payload: { firstName: string; lastName: string; email: string; roleId?: string }) => {
    const { data } = await api.post('/super-admin/team/staff', payload);
    return data;
  },
  setStaffActive: async (id: string, isActive: boolean) => {
    const { data } = await api.patch(`/super-admin/team/staff/${id}/status`, { isActive });
    return data;
  },
  resetStaffPassword: async (id: string) => {
    const { data } = await api.post(`/super-admin/team/staff/${id}/reset-password`);
    return data;
  },
};

export default platformTeamService;
