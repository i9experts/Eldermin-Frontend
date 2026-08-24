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

// ── Commission & Billing Engine (Phase 2) ────────────────────────
export const useRunCommissionBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodMonth?: string) => resellersApi.runCommissionBatch(periodMonth),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa', 'resellers'] });
      qc.invalidateQueries({ queryKey: ['sa', 'commission-ledger'] });
    },
  });
};

export const useCommissionLedger = (id: string, params?: any) =>
  useQuery({
    queryKey: ['sa', 'commission-ledger', id, params],
    queryFn: () => resellersApi.getCommissionLedger(id, params),
    enabled: !!id,
  });

// ── Self-serve provisioning queue (Phase 2) ──────────────────────
export const useProvisioningQueue = (params?: any) =>
  useQuery({ queryKey: ['sa', 'provisioning-requests', params], queryFn: () => resellersApi.getProvisioningQueue(params) });

export const useReviewProvisioningRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { decision: 'approved' | 'rejected'; reviewNote?: string } }) =>
      resellersApi.reviewProvisioningRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa', 'provisioning-requests'] });
      qc.invalidateQueries({ queryKey: ['sa', 'resellers'] });
      qc.invalidateQueries({ queryKey: ['sa', 'institutions'] });
    },
  });
};

// ── Deal registration (Phase 2) ──────────────────────────────────
export const useDeals = (params?: any) =>
  useQuery({ queryKey: ['sa', 'deals', params], queryFn: () => resellersApi.getDeals(params) });

export const useConvertDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, institutionId }: { id: string; institutionId: string }) => resellersApi.convertDeal(id, institutionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa', 'deals'] });
      qc.invalidateQueries({ queryKey: ['sa', 'resellers'] });
    },
  });
};

export const useRejectDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewNote }: { id: string; reviewNote?: string }) => resellersApi.rejectDeal(id, reviewNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'deals'] }),
  });
};

// ── Reseller Portal v1 — account provisioning ────────────────────
export const useCreatePortalUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { email: string; name?: string; role?: string } }) =>
      resellersApi.createPortalUser(id, data),
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['sa', 'portal-users', vars.id] }),
  });
};

export const usePortalUsers = (id: string) =>
  useQuery({ queryKey: ['sa', 'portal-users', id], queryFn: () => resellersApi.getPortalUsers(id), enabled: !!id });
