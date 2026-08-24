import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as resellersApi from '../services/resellers.api';

const KEYS = {
  resellers: (p?: any) => ['sa', 'resellers', p] as const,
  reseller: (id: string) => ['sa', 'reseller', id] as const,
  commission: (id: string) => ['sa', 'reseller', id, 'commission'] as const,
};

export const useResellers = (params?: any) =>
  useQuery({ queryKey: KEYS.resellers(params), queryFn: () => resellersApi.fetchResellers(params) });

export const useReseller = (id: string) =>
  useQuery({ queryKey: KEYS.reseller(id), queryFn: () => resellersApi.getReseller(id), enabled: !!id });

export const useCommissionSummary = (id: string) =>
  useQuery({ queryKey: KEYS.commission(id), queryFn: () => resellersApi.getCommissionSummary(id), enabled: !!id });

export const useCreateReseller = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resellersApi.createReseller,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'resellers'] }),
  });
};

export const useUpdateReseller = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => resellersApi.updateReseller(id, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['sa', 'resellers'] });
      qc.invalidateQueries({ queryKey: KEYS.reseller(vars.id) });
    },
  });
};

export const useUpdateResellerStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; reason?: string } }) =>
      resellersApi.updateResellerStatus(id, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['sa', 'resellers'] });
      qc.invalidateQueries({ queryKey: KEYS.reseller(vars.id) });
    },
  });
};

export const useProvisionInstitution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => resellersApi.provisionInstitution(id, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['sa', 'resellers'] });
      qc.invalidateQueries({ queryKey: KEYS.reseller(vars.id) });
      qc.invalidateQueries({ queryKey: ['sa', 'institutions'] });
    },
  });
};
