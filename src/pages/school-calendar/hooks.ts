import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schoolCalendarApi from './api';

const K = {
  events: (p?: any) => ['school-calendar', 'events', p] as const,
  circulars: (p?: any) => ['school-calendar', 'circulars', p] as const,
  circular: (id?: string) => ['school-calendar', 'circulars', 'detail', id] as const,
  ackStatus: (id?: string) => ['school-calendar', 'circulars', 'ack-status', id] as const,
};

// ── Calendar ──────────────────────────────────────────────────────
export const useCalendarEvents = (params?: { from?: string; to?: string; campusId?: string }) =>
  useQuery({ queryKey: K.events(params), queryFn: () => schoolCalendarApi.getEvents(params) });

export const useCreateCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schoolCalendarApi.createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'events'] }),
  });
};

export const useUpdateCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schoolCalendarApi.updateEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'events'] }),
  });
};

export const useDeleteCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolCalendarApi.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'events'] }),
  });
};

// ── Circulars ─────────────────────────────────────────────────────
export const useCirculars = (params?: { status?: string; category?: string }) =>
  useQuery({ queryKey: K.circulars(params), queryFn: () => schoolCalendarApi.getCirculars(params) });

export const useCircular = (id?: string) =>
  useQuery({ queryKey: K.circular(id), queryFn: () => schoolCalendarApi.getCircularById(id as string), enabled: !!id });

export const useCreateCircular = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schoolCalendarApi.createCircular,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'circulars'] }),
  });
};

export const useUpdateCircular = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schoolCalendarApi.updateCircular(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'circulars'] }),
  });
};

export const useDeleteCircular = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolCalendarApi.deleteCircular(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'circulars'] }),
  });
};

export const usePublishCircular = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolCalendarApi.publishCircular(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school-calendar', 'circulars'] }),
  });
};

export const useAcknowledgmentStatus = (id?: string) =>
  useQuery({ queryKey: K.ackStatus(id), queryFn: () => schoolCalendarApi.getAcknowledgmentStatus(id as string), enabled: !!id });
