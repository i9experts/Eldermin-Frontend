import api from '../../lib/api';

const BASE = '/events';

const eventsApi = {
  // Admin: events
  getEvents: async (params?: any) => { const { data } = await api.get(BASE, { params }); return data; },
  getEventById: async (id: string) => { const { data } = await api.get(`${BASE}/${id}`); return data; },
  createEvent: async (payload: any) => { const { data } = await api.post(BASE, payload); return data; },
  updateEvent: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/${id}`, payload); return data; },
  deleteEvent: async (id: string) => { const { data } = await api.delete(`${BASE}/${id}`); return data; },
  setEventStatus: async (id: string, status: string) => { const { data } = await api.patch(`${BASE}/${id}/status`, { status }); return data; },
  getEventDashboard: async (id: string) => { const { data } = await api.get(`${BASE}/${id}/dashboard`); return data; },
  checkVenueAvailability: async (payload: { venueName: string; sessions: any[]; excludeEventId?: string }) => {
    const { data } = await api.post(`${BASE}/venue-availability`, payload);
    return data;
  },

  // Admin: ticket types
  createTicketType: async (eventId: string, payload: any) => { const { data } = await api.post(`${BASE}/${eventId}/ticket-types`, payload); return data; },
  updateTicketType: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/ticket-types/${id}`, payload); return data; },
  deleteTicketType: async (id: string) => { const { data } = await api.delete(`${BASE}/ticket-types/${id}`); return data; },

  // Admin: promo codes
  createPromoCode: async (eventId: string, payload: any) => { const { data } = await api.post(`${BASE}/${eventId}/promo-codes`, payload); return data; },
  updatePromoCode: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/promo-codes/${id}`, payload); return data; },
  deletePromoCode: async (id: string) => { const { data } = await api.delete(`${BASE}/promo-codes/${id}`); return data; },

  // Admin: box office / orders
  getOrders: async (eventId: string) => { const { data } = await api.get(`${BASE}/${eventId}/orders`); return data; },
  createBoxOfficeOrder: async (eventId: string, payload: any) => { const { data } = await api.post(`${BASE}/${eventId}/orders`, payload); return data; },
  markOrderPaid: async (orderId: string) => { const { data } = await api.post(`${BASE}/orders/${orderId}/mark-paid`); return data; },
  cancelOrder: async (orderId: string, reason?: string, refundReference?: string) => {
    const { data } = await api.post(`${BASE}/orders/${orderId}/cancel`, { reason, refundReference });
    return data;
  },
  refundTickets: async (orderId: string, ticketIds: string[], refundReference: string) => {
    const { data } = await api.post(`${BASE}/orders/${orderId}/refund-tickets`, { ticketIds, refundReference });
    return data;
  },

  // Admin: reserved seating
  getSeatMap: async (eventId: string) => { const { data } = await api.get(`${BASE}/${eventId}/seat-map`); return data; },
  upsertSeatMap: async (eventId: string, payload: { name: string; seats: any[] }) => { const { data } = await api.put(`${BASE}/${eventId}/seat-map`, payload); return data; },
  deleteSeatMap: async (eventId: string) => { const { data } = await api.delete(`${BASE}/${eventId}/seat-map`); return data; },

  // Admin: gate stats (multi-gate / kiosk check-in)
  getGateStats: async (eventId: string) => { const { data } = await api.get(`${BASE}/${eventId}/gate-stats`); return data; },

  // Admin: campaigns (CRM)
  getCampaigns: async (eventId: string) => { const { data } = await api.get(`${BASE}/${eventId}/campaigns`); return data; },
  createCampaign: async (eventId: string, payload: any) => { const { data } = await api.post(`${BASE}/${eventId}/campaigns`, payload); return data; },
  updateCampaign: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/campaigns/${id}`, payload); return data; },
  deleteCampaign: async (id: string) => { const { data } = await api.delete(`${BASE}/campaigns/${id}`); return data; },
  sendCampaignNow: async (id: string) => { const { data } = await api.post(`${BASE}/campaigns/${id}/send-now`); return data; },

  // Admin: attendees
  getAttendees: async (eventId: string) => { const { data } = await api.get(`${BASE}/${eventId}/attendees`); return data; },
  lookupAttendeeHistory: async (params: { email?: string; phone?: string }) => {
    const { data } = await api.get(`${BASE}/attendees/lookup`, { params });
    return data;
  },

  // Admin: merchandise (box office only)
  getMerchItems: async (eventId: string) => { const { data } = await api.get(`${BASE}/${eventId}/merch`); return data; },
  createMerchItem: async (eventId: string, payload: any) => { const { data } = await api.post(`${BASE}/${eventId}/merch`, payload); return data; },
  updateMerchItem: async (id: string, payload: any) => { const { data } = await api.patch(`${BASE}/merch/${id}`, payload); return data; },
  deleteMerchItem: async (id: string) => { const { data } = await api.delete(`${BASE}/merch/${id}`); return data; },

  // Admin: check-in
  checkIn: async (eventId: string, qrToken: string, gate?: string) => { const { data } = await api.post(`${BASE}/${eventId}/check-in`, { qrToken, gate }); return data; },
  checkInSearch: async (eventId: string, q: string) => { const { data } = await api.get(`${BASE}/${eventId}/check-in/search`, { params: { q } }); return data; },

  // Admin: badges
  generateBadges: async (ticketIds: string[]) => {
    const { data } = await api.post(`${BASE}/badges/generate`, { ticketIds }, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'badges.pdf'; a.click();
    URL.revokeObjectURL(url);
  },

  // Public (no auth)
  getPublicEvents: async (schoolSlug: string) => { const { data } = await api.get(`${BASE}/public/${schoolSlug}`); return data; },
  getPublicEvent: async (schoolSlug: string, slug: string) => { const { data } = await api.get(`${BASE}/public/${schoolSlug}/${slug}`); return data; },
  checkout: async (schoolSlug: string, eventId: string, payload: any) => {
    const { data } = await api.post(`${BASE}/public/${schoolSlug}/${eventId}/checkout`, payload);
    return data;
  },
};

export default eventsApi;
