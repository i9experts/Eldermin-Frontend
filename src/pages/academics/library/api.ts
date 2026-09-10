import api from '../../../lib/api';

const BASE = '/academics/library';

const libraryApi = {
  // Settings
  getSettings: async () => { const { data } = await api.get(`${BASE}/settings`); return data; },
  updateSettings: async (payload: any) => { const { data } = await api.put(`${BASE}/settings`, payload); return data; },

  // Books
  getBooks: async (params?: any) => { const { data } = await api.get(`${BASE}/books`, { params }); return data; },
  getBookById: async (id: string) => { const { data } = await api.get(`${BASE}/books/${id}`); return data; },
  createBook: async (payload: any) => { const { data } = await api.post(`${BASE}/books`, payload); return data; },
  updateBook: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/books/${id}`, payload); return data; },
  deaccessionBook: async (id: string) => { const { data } = await api.patch(`${BASE}/books/${id}/deaccession`); return data; },

  // Issues
  getIssues: async (params?: any) => { const { data } = await api.get(`${BASE}/issues`, { params }); return data; },
  issueBook: async (payload: any) => { const { data } = await api.post(`${BASE}/issue`, payload); return data; },
  returnBook: async (issueId: string, payload?: any) => { const { data } = await api.patch(`${BASE}/return/${issueId}`, payload ?? {}); return data; },
  renewIssue: async (issueId: string) => { const { data } = await api.post(`${BASE}/issues/${issueId}/renew`); return data; },
  markFinePaid: async (issueId: string) => { const { data } = await api.patch(`${BASE}/issues/${issueId}/fine-paid`); return data; },
  markLost: async (issueId: string, payload?: { replacementCharge?: number; notes?: string }) => {
    const { data } = await api.post(`${BASE}/issues/${issueId}/lost`, payload ?? {}); return data;
  },
  markDamaged: async (issueId: string, payload?: { notes?: string }) => {
    const { data } = await api.post(`${BASE}/issues/${issueId}/damaged`, payload ?? {}); return data;
  },

  // Reservations
  getReservations: async (params?: any) => { const { data } = await api.get(`${BASE}/reservations`, { params }); return data; },
  createReservation: async (payload: any) => { const { data } = await api.post(`${BASE}/reservations`, payload); return data; },
  cancelReservation: async (id: string) => { const { data } = await api.delete(`${BASE}/reservations/${id}`); return data; },

  // Overdue
  getOverdue: async () => { const { data } = await api.get(`${BASE}/overdue`); return data; },

  // Reports
  getDefaultersReport: async () => { const { data } = await api.get(`${BASE}/reports/defaulters`); return data; },
  getMostBorrowedReport: async (limit = 10) => { const { data } = await api.get(`${BASE}/reports/most-borrowed`, { params: { limit } }); return data; },
  getCirculationByCategoryReport: async () => { const { data } = await api.get(`${BASE}/reports/circulation-by-category`); return data; },
  exportReport: async (type: 'defaulters' | 'most-borrowed' | 'circulation') => {
    const { data } = await api.get(`${BASE}/reports/export`, { params: { type }, responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a');
    a.href = url; a.download = `library-${type}-report.xlsx`; a.click();
    URL.revokeObjectURL(url);
  },
};

export default libraryApi;
