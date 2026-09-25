import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventsApi from './api';

const K = {
  events: (p?: any) => ['events', 'list', p] as const,
  event: (id?: string) => ['events', 'detail', id] as const,
  dashboard: (id?: string) => ['events', 'dashboard', id] as const,
  orders: (id?: string) => ['events', 'orders', id] as const,
  attendees: (id?: string) => ['events', 'attendees', id] as const,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.orders(eventId) }); qc.invalidateQueries({ queryKey: K.event(eventId) }); qc.invalidateQueries({ queryKey: K.dashboard(eventId) }); },
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
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => eventsApi.cancelOrder(orderId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.orders(eventId) }); qc.invalidateQueries({ queryKey: K.event(eventId) }); qc.invalidateQueries({ queryKey: K.dashboard(eventId) }); },
  });
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
