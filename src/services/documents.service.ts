import api from '../lib/api';

const documentsService = {
  getDashboard: async () => {
    const { data } = await api.get('/documents/dashboard');
    return data;
  },
  getDocuments: async (params?: { category?: string; status?: string; search?: string }) => {
    const { data } = await api.get('/documents', { params });
    return data;
  },
  createDocument: async (payload: any) => {
    const { data } = await api.post('/documents', payload);
    return data;
  },
  updateDocument: async (id: string, payload: any) => {
    const { data } = await api.put(`/documents/${id}`, payload);
    return data;
  },
  archiveDocument: async (id: string) => {
    const { data } = await api.patch(`/documents/${id}/archive`);
    return data;
  },
  incrementView: async (id: string) => {
    const { data } = await api.patch(`/documents/${id}/view`);
    return data;
  },
  getWorkflowTemplates: async (type?: string) => {
    const { data } = await api.get('/documents/workflow-templates', { params: type ? { type } : undefined });
    return data;
  },
  createWorkflowTemplate: async (payload: any) => {
    const { data } = await api.post('/documents/workflow-templates', payload);
    return data;
  },
  seedWorkflowTemplates: async () => {
    const { data } = await api.post('/documents/workflow-templates/seed');
    return data;
  },
  getWorkflows: async (params?: { status?: string; type?: string }) => {
    const { data } = await api.get('/documents/workflows', { params });
    return data;
  },
  getMyApprovals: async () => {
    const { data } = await api.get('/documents/workflows/my-approvals');
    return data;
  },
  initiateWorkflow: async (payload: any) => {
    const { data } = await api.post('/documents/workflows', payload);
    return data;
  },
  takeAction: async (id: string, payload: any) => {
    const { data } = await api.patch(`/documents/workflows/${id}/action`, payload);
    return data;
  },
  cancelWorkflow: async (id: string, reason: string) => {
    const { data } = await api.patch(`/documents/workflows/${id}/cancel`, { reason });
    return data;
  },
};

export default documentsService;
