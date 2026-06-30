import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/compliance.api';

const K = {
  dashboard:    ['compliance', 'dashboard'] as const,
  policies:     (p?: any) => ['compliance', 'policies', p] as const,
  safeguarding: (p?: any) => ['compliance', 'safeguarding', p] as const,
  auditLogs:    (p?: any) => ['compliance', 'audit-logs', p] as const,
  accreditation: ['compliance', 'accreditation'] as const,
};

export const useComplianceDashboard = () =>
  useQuery({ queryKey: K.dashboard, queryFn: api.fetchDashboard });

export const usePolicies = (params?: { status?: string; search?: string }) =>
  useQuery({ queryKey: K.policies(params), queryFn: () => api.fetchPolicies(params) });

export const useCreatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'policies'] });
      qc.invalidateQueries({ queryKey: K.dashboard });
    },
  });
};

export const useUpdatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePolicy(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'policies'] }),
  });
};

export const useAcknowledgePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => api.acknowledgePolicy(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'policies'] });
      qc.invalidateQueries({ queryKey: K.dashboard });
    },
  });
};

export const useSafeguarding = (params?: { status?: string; search?: string }) =>
  useQuery({ queryKey: K.safeguarding(params), queryFn: () => api.fetchSafeguarding(params) });

export const useCreateSafeguarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSafeguarding,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'safeguarding'] });
      qc.invalidateQueries({ queryKey: K.dashboard });
    },
  });
};

export const useUpdateSafeguarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateSafeguarding(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'safeguarding'] }),
  });
};

export const useAddSafeguardingNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.addSafeguardingNote(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'safeguarding'] }),
  });
};

export const useAuditLogs = (params?: { page?: number; limit?: number; action?: string }) =>
  useQuery({ queryKey: K.auditLogs(params), queryFn: () => api.fetchAuditLogs(params) });

export const useAccreditation = () =>
  useQuery({ queryKey: K.accreditation, queryFn: api.fetchAccreditation });

export const useCreateAccreditation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAccreditation,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.accreditation }),
  });
};
