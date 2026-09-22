import api from '../../lib/api';

const BASE = '/school-calendar';

const schoolCalendarApi = {
  // Calendar
  getEvents: async (params?: { from?: string; to?: string; campusId?: string }) => {
    const { data } = await api.get(`${BASE}/events`, { params });
    return data;
  },
  createEvent: async (payload: any) => { const { data } = await api.post(`${BASE}/events`, payload); return data; },
  updateEvent: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/events/${id}`, payload); return data; },
  deleteEvent: async (id: string) => { const { data } = await api.delete(`${BASE}/events/${id}`); return data; },

  // Circulars
  getCirculars: async (params?: { status?: string; category?: string }) => {
    const { data } = await api.get(`${BASE}/circulars`, { params });
    return data;
  },
  getCircularById: async (id: string) => { const { data } = await api.get(`${BASE}/circulars/${id}`); return data; },
  createCircular: async (payload: any) => { const { data } = await api.post(`${BASE}/circulars`, payload); return data; },
  updateCircular: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/circulars/${id}`, payload); return data; },
  deleteCircular: async (id: string) => { const { data } = await api.delete(`${BASE}/circulars/${id}`); return data; },
  publishCircular: async (id: string) => { const { data } = await api.post(`${BASE}/circulars/${id}/publish`); return data; },
  getAcknowledgmentStatus: async (id: string) => { const { data } = await api.get(`${BASE}/circulars/${id}/acknowledgment-status`); return data; },
  acknowledgeCircular: async (id: string) => { const { data } = await api.post(`${BASE}/circulars/${id}/acknowledge`); return data; },
};

export default schoolCalendarApi;
