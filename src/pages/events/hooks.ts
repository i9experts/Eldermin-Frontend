import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventsApi from './api';

export const K = {
  events: (p?: any) => ['events', 'list', p] as const,
  event: (id?: string) => ['events', 'detail', id] as const,
  dashboard: (id?: string) => ['events', 'dashboard', id] as const,
  orders: (id?: string) => ['events', 'orders', id] as const,
  attendees: (id?: string) => ['events', 'attendees', id] as const,
  seatMap: (id?: string) => ['events', 'seat-map', id] as const,
  gateStats: (id?: string) => ['events', 'gate-stats', id] as const,
  campaigns: (id?: string) => ['events', 'campaigns', id] as const,
  merch: (id?: string) => ['events', 'merch', id] as const,
  publicEvents: (slug?: string) => ['events', 'public', slug] as const,
  publicEvent: (slug?: string, eventSlug?: string) => ['events', 'public', slug, eventSlug] as const,
};

// ── Admin: events ────────────────────────────────────────────────
export const useEvents = (params?: any) =>
  useQuery({ queryKey: K.events(params), queryFn: () => eventsApi.getEvents(params) });

export const useEvent = (id?: string) =>
  useQuery({ queryKey: K.event(id), queryFn: () => eventsApi.getEventById(id as string), enabled: !!id });

export const useEventDashboard = (id?: string) =>
  useQuery({ queryKey: K.dashboard(id), queryFn: () => eventsApi.getEventDashboard(id as string), enabled: !!id, refetchInterval: id ? 15000 : false });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: eventsApi.createEvent, onSuccess: () => qc.invalidateQueries({ queryKey: ['events', 'list'] }) });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eventsApi.updateEvent(id, data),
    onSuccess: (_r, v) => { qc.invalidateQueries({ queryKey: ['events', 'list'] }); qc.invalidateQueries({ queryKey: K.event(v.id) }); },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.deleteEvent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['events', 'list'] }) });
};

// Not a useQuery - the admin is actively typing venue/session values, not
// reading a stored resource, so this is a plain mutation triggered
// on-change/on-blur by the caller.
export const useCheckVenueAvailability = () =>
  useMutation({ mutationFn: (payload: { venueName: string; sessions: any[]; excludeEventId?: string }) => eventsApi.checkVenueAvailability(payload) });

export const useSetEventStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => eventsApi.setEventStatus(id, status),
    onSuccess: (_r, v) => { qc.invalidateQueries({ queryKey: ['events', 'list'] }); qc.invalidateQueries({ queryKey: K.event(v.id) }); },
  });
};

// ── Admin: ticket types ──────────────────────────────────────────
export const useCreateTicketType = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: any) => eventsApi.createTicketType(eventId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: K.event(eventId) }) });
};
export const useUpdateTicketType = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => eventsApi.updateTicketType(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: K.event(eventId) }) });
};
export const useDeleteTicketType = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.deleteTicketType(id), onSuccess: () => qc.invalidateQueries({ queryKey: K.event(eventId) }) });
};

// ── Admin: promo codes ────────────────────────────────────────────
export const useCreatePromoCode = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: any) => eventsApi.createPromoCode(eventId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: K.event(eventId) }) });
};
export const useDeletePromoCode = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.deletePromoCode(id), onSuccess: () => qc.invalidateQueries({ queryKey: K.event(eventId) }) });
};

// ── Admin: orders / box office ───────────────────────────────────
export const useOrders = (eventId?: string) =>
  useQuery({ queryKey: K.orders(eventId), queryFn: () => eventsApi.getOrders(eventId as string), enabled: !!eventId });

export const useCreateBoxOfficeOrder = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => eventsApi.createBoxOfficeOrder(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.orders(eventId) });
      qc.invalidateQueries({ queryKey: K.event(eventId) });
      qc.invalidateQueries({ queryKey: K.dashboard(eventId) });
      qc.invalidateQueries({ queryKey: K.seatMap(eventId) });
      qc.invalidateQueries({ queryKey: K.merch(eventId) });
    },
  });
};
export const useMarkOrderPaid = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => eventsApi.markOrderPaid(orderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.orders(eventId) }); qc.invalidateQueries({ queryKey: K.attendees(eventId) }); qc.invalidateQueries({ queryKey: K.dashboard(eventId) }); },
  });
};
export const useCancelOrder = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason, refundReference }: { orderId: string; reason?: string; refundReference?: string }) =>
      eventsApi.cancelOrder(orderId, reason, refundReference),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.orders(eventId) });
      qc.invalidateQueries({ queryKey: K.event(eventId) });
      qc.invalidateQueries({ queryKey: K.dashboard(eventId) });
      qc.invalidateQueries({ queryKey: K.seatMap(eventId) });
    },
  });
};

export const useRefundTickets = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ticketIds, refundReference }: { orderId: string; ticketIds: string[]; refundReference: string }) =>
      eventsApi.refundTickets(orderId, ticketIds, refundReference),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.orders(eventId) });
      qc.invalidateQueries({ queryKey: K.attendees(eventId) });
      qc.invalidateQueries({ queryKey: K.event(eventId) });
      qc.invalidateQueries({ queryKey: K.dashboard(eventId) });
    },
  });
};

// ── Admin: merchandise (box office only) ─────────────────────────────
export const useMerchItems = (eventId?: string) =>
  useQuery({ queryKey: K.merch(eventId), queryFn: () => eventsApi.getMerchItems(eventId as string), enabled: !!eventId });

export const useCreateMerchItem = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: any) => eventsApi.createMerchItem(eventId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: K.merch(eventId) }) });
};
export const useUpdateMerchItem = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => eventsApi.updateMerchItem(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: K.merch(eventId) }) });
};
export const useDeleteMerchItem = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.deleteMerchItem(id), onSuccess: () => qc.invalidateQueries({ queryKey: K.merch(eventId) }) });
};

// ── Admin: cross-event loyalty/CRM lookup ─────────────────────────────
export const useLookupAttendeeHistory = () =>
  useMutation({ mutationFn: (params: { email?: string; phone?: string }) => eventsApi.lookupAttendeeHistory(params) });

// ── Admin: reserved seating ─────────────────────────────────────────
export const useSeatMap = (eventId?: string) =>
  useQuery({ queryKey: K.seatMap(eventId), queryFn: () => eventsApi.getSeatMap(eventId as string), enabled: !!eventId });

export const useUpsertSeatMap = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; seats: any[] }) => eventsApi.upsertSeatMap(eventId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.seatMap(eventId) }); qc.invalidateQueries({ queryKey: K.event(eventId) }); },
  });
};

export const useDeleteSeatMap = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => eventsApi.deleteSeatMap(eventId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.seatMap(eventId) }); qc.invalidateQueries({ queryKey: K.event(eventId) }); },
  });
};

// ── Admin: gate stats ────────────────────────────────────────────────
export const useGateStats = (eventId?: string, opts: { refetchInterval?: number } = {}) =>
  useQuery({ queryKey: K.gateStats(eventId), queryFn: () => eventsApi.getGateStats(eventId as string), enabled: !!eventId, refetchInterval: opts.refetchInterval });

// ── Admin: campaigns (CRM) ───────────────────────────────────────────
export const useCampaigns = (eventId?: string) =>
  useQuery({ queryKey: K.campaigns(eventId), queryFn: () => eventsApi.getCampaigns(eventId as string), enabled: !!eventId });

export const useCreateCampaign = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: any) => eventsApi.createCampaign(eventId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: K.campaigns(eventId) }) });
};
export const useUpdateCampaign = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => eventsApi.updateCampaign(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: K.campaigns(eventId) }) });
};
export const useDeleteCampaign = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.deleteCampaign(id), onSuccess: () => qc.invalidateQueries({ queryKey: K.campaigns(eventId) }) });
};
export const useSendCampaignNow = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.sendCampaignNow(id), onSuccess: () => qc.invalidateQueries({ queryKey: K.campaigns(eventId) }) });
};

// ── Admin: attendees ──────────────────────────────────────────────
export const useAttendees = (eventId?: string) =>
  useQuery({ queryKey: K.attendees(eventId), queryFn: () => eventsApi.getAttendees(eventId as string), enabled: !!eventId });

// ── Admin: check-in ────────────────────────────────────────────────
export const useCheckIn = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qrToken, gate }: { qrToken: string; gate?: string }) => eventsApi.checkIn(eventId, qrToken, gate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.attendees(eventId) }); qc.invalidateQueries({ queryKey: K.dashboard(eventId) }); },
  });
};
export const useCheckInSearch = (eventId: string, q: string) =>
  useQuery({ queryKey: ['events', 'check-in-search', eventId, q], queryFn: () => eventsApi.checkInSearch(eventId, q), enabled: !!eventId && q.length >= 2 });

// ── Public ────────────────────────────────────────────────────────
export const usePublicEvents = (schoolSlug?: string) =>
  useQuery({ queryKey: K.publicEvents(schoolSlug), queryFn: () => eventsApi.getPublicEvents(schoolSlug as string), enabled: !!schoolSlug });

export const usePublicEvent = (schoolSlug?: string, eventSlug?: string) =>
  useQuery({ queryKey: K.publicEvent(schoolSlug, eventSlug), queryFn: () => eventsApi.getPublicEvent(schoolSlug as string, eventSlug as string), enabled: !!schoolSlug && !!eventSlug });

export const useCheckout = (schoolSlug: string, eventId: string) =>
  useMutation({ mutationFn: (payload: any) => eventsApi.checkout(schoolSlug, eventId, payload) });
