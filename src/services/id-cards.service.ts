import api from '../lib/api';

export interface IdCardTemplate {
  _id: string;
  schoolSlug: string;
  entityType: 'student' | 'staff';
  name: string;
  layoutStyle: 'classic' | 'modern' | 'minimal';
  primaryColor: string;
  accentColor: string;
  backgroundImageUrl?: string;
  showFields: string[];
  showQrCode: boolean;
  showBarcode: boolean;
  showSignatureLine: boolean;
  validityText?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

const idCardsService = {
  listTemplates: async (entityType?: 'student' | 'staff'): Promise<IdCardTemplate[]> => {
    const { data } = await api.get('/id-cards/templates', { params: { entityType } });
    return data;
  },
  createTemplate: async (payload: Partial<IdCardTemplate>) => {
    const { data } = await api.post('/id-cards/templates', payload);
    return data;
  },
  updateTemplate: async (id: string, payload: Partial<IdCardTemplate>) => {
    const { data } = await api.put(`/id-cards/templates/${id}`, payload);
    return data;
  },
  deleteTemplate: async (id: string) => {
    const { data } = await api.delete(`/id-cards/templates/${id}`);
    return data;
  },
  setDefaultTemplate: async (id: string) => {
    const { data } = await api.post(`/id-cards/templates/${id}/set-default`);
    return data;
  },
  generate: async (payload: { entityType: 'student' | 'staff'; templateId?: string; ids: string[]; includeBack?: boolean }) => {
    const res = await api.post('/id-cards/generate', payload, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id-cards-${payload.entityType}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default idCardsService;
