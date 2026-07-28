import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as leadsApi from '../services/leads.api';

const KEYS = {
  list: (stage?: string) => ['leads', 'list', stage] as const,
  stats: ['leads', 'stats'] as const,
  detail: (id: string) => ['leads', 'detail', id] as const,
};

export const useLeads = (stage?: string) =>
  useQuery({ queryKey: KEYS.list(stage), queryFn: () => leadsApi.getLeads(stage) });

export const useLeadStats = () =>
  useQuery({ queryKey: KEYS.stats, queryFn: leadsApi.getLeadStats });

export const useLead = (id: string) =>
  useQuery({ queryKey: KEYS.detail(id), queryFn: () => leadsApi.getLead(id), enabled: !!id });

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { stage?: string; assignedTo?: string } }) =>
      leadsApi.updateLead(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useAddLeadNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => leadsApi.addLeadNote(id, text),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
      qc.invalidateQueries({ queryKey: ['leads', 'list'] });
    },
  });
};
