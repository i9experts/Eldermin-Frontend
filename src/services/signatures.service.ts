import api from '../lib/api';

export interface SignatureRecipientInput {
  name: string;
  email: string;
}

export interface CreateSignatureRequestPayload {
  documentId?: string;
  documentName?: string;
  fileUrl?: string;
  fileName?: string;
  recipients: SignatureRecipientInput[];
  signingOrder: 'any' | 'sequential';
  deadline?: string;
  message?: string;
}

const signaturesService = {
  getDashboard: async () => {
    const { data } = await api.get('/documents/signatures/dashboard');
    return data;
  },
  getRequests: async (params?: { status?: string; mine?: boolean }) => {
    const { data } = await api.get('/documents/signatures', { params });
    return data;
  },
  getRequest: async (id: string) => {
    const { data } = await api.get(`/documents/signatures/${id}`);
    return data;
  },
  createRequest: async (payload: CreateSignatureRequestPayload) => {
    const { data } = await api.post('/documents/signatures', payload);
    return data;
  },
  cancelRequest: async (id: string) => {
    const { data } = await api.patch(`/documents/signatures/${id}/cancel`);
    return data;
  },
  signMine: async (id: string, payload: { typedName: string; designation?: string; signatureImage?: string }) => {
    const { data } = await api.post(`/documents/signatures/${id}/sign-mine`, payload);
    return data;
  },
  declineMine: async (id: string, reason?: string) => {
    const { data } = await api.post(`/documents/signatures/${id}/decline-mine`, { reason });
    return data;
  },

  // Public (no auth) — the recipient sign page at /e-sign/:token
  getByToken: async (token: string) => {
    const { data } = await api.get(`/documents/signatures/public/${token}`);
    return data;
  },
  signByToken: async (token: string, payload: { typedName: string; designation?: string; signatureImage?: string }) => {
    const { data } = await api.post(`/documents/signatures/public/${token}/sign`, payload);
    return data;
  },
  declineByToken: async (token: string, reason?: string) => {
    const { data } = await api.post(`/documents/signatures/public/${token}/decline`, { reason });
    return data;
  },
};

export default signaturesService;
