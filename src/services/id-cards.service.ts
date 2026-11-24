import api from '../lib/api';

export interface IdCardTemplate {
  _id: string;
  schoolSlug: string;
  entityType: 'student' | 'staff';
  name: string;
  layoutStyle: 'classic' | 'modern' | 'minimal' | 'vibrant';
  primaryColor: string;
  accentColor: string;
  backgroundImageUrl?: string;
  backgroundImageOpacity?: number;
  showFields: string[];
  showQrCode: boolean;
  showBarcode: boolean;
  showSignatureLine: boolean;
  validityText?: string;
  noteText?: string;
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
  generate: async (payload: { entityType: 'student' | 'staff'; templateId?: string; ids: string[]; includeBack?: boolean; printMode?: 'pvc_card' | 'a4_sheet' }) => {
    try {
      const res = await api.post('/id-cards/generate', payload, { responseType: 'blob', timeout: 180000 });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `id-cards-${payload.entityType}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const photosOmittedForConsent = Number(res.headers['x-photos-omitted-consent'] || 0);
      return { photosOmittedForConsent };
    } catch (err: any) {
      // With responseType: 'blob', axios hands back the error body as a
      // Blob too (not parsed JSON) - so `err.response?.data?.message`
      // was always undefined here and every failure showed the same
      // generic "Failed to generate ID cards" toast regardless of the
      // real reason. Read the Blob's text back out and re-throw it in
      // the shape every other caller's `err.response?.data?.message`
      // already expects, so the real backend message reaches the admin.
      const blob = err?.response?.data;
      if (blob instanceof Blob && blob.type.includes('json')) {
        try {
          const text = await blob.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) err.response.data = parsed;
        } catch { /* leave err as-is - still a Blob, falls back to the generic toast */ }
      }
      throw err;
    }
  },
};

export default idCardsService;
