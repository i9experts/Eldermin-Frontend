import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as saApi from '../services/super-admin.api';

const KEYS = {
  dashboard:     ['sa', 'dashboard'] as const,
  institutions:  (p?: any) => ['sa', 'institutions', p] as const,
  institution:   (slug: string) => ['sa', 'institution', slug] as const,
  alerts:        ['sa', 'alerts'] as const,
  analytics:     ['sa', 'analytics'] as const,
  announcements: ['sa', 'announcements'] as const,
  tickets:       (p?: any) => ['sa', 'tickets', p] as const,
};

export const useBIDashboard = () =>
  useQuery({ queryKey: KEYS.dashboard, queryFn: saApi.fetchBIDashboard });

export const useInstitutions = (params?: any) =>
  useQuery({ queryKey: KEYS.institutions(params), queryFn: () => saApi.fetchInstitutions(params) });

export const useInstitution = (slug: string) =>
  useQuery({ queryKey: KEYS.institution(slug), queryFn: () => saApi.getInstitution(slug), enabled: !!slug });

export const useAlerts = () =>
  useQuery({ queryKey: KEYS.alerts, queryFn: saApi.getAlerts });

export const usePlatformAnalytics = () =>
  useQuery({ queryKey: KEYS.analytics, queryFn: saApi.getAnalytics });

export const useAnnouncements = () =>
  useQuery({ queryKey: KEYS.announcements, queryFn: saApi.getAnnouncements });

export const useTickets = (params?: any) =>
  useQuery({ queryKey: KEYS.tickets(params), queryFn: () => saApi.getTickets(params) });

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => saApi.updateTicket(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'tickets'] }),
  });
};

export const useReplyToTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => saApi.replyToTicket(id, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'tickets'] }),
  });
};

export const useCreateInstitution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saApi.createInstitution,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'institutions'] }),
  });
};

export const useActivateInstitutionFromLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => saApi.activateInstitutionFromLead(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa', 'institutions'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useUpdateStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: any }) => saApi.updateStatus(slug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'institutions'] }),
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: any }) => saApi.updateSubscription(slug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'institutions'] }),
  });
};

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saApi.createAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'announcements'] }),
  });
};
