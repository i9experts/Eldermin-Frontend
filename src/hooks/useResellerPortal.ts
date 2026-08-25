import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/reseller-portal.api';

export const useResellerDashboard = () =>
  useQuery({ queryKey: ['rp', 'dashboard'], queryFn: api.fetchDashboard });

export const useResellerCommissionLedger = (params?: any) =>
  useQuery({ queryKey: ['rp', 'commission-ledger', params], queryFn: () => api.fetchCommissionLedger(params) });

export const useResellerCommissionSummary = () =>
  useQuery({ queryKey: ['rp', 'commission-summary'], queryFn: api.fetchCommissionSummary });

export const useResellerProvisioningRequests = () =>
  useQuery({ queryKey: ['rp', 'provisioning-requests'], queryFn: () => api.fetchProvisioningRequests() });

export const useSubmitProvisioningRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.submitProvisioningRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rp', 'provisioning-requests'] }),
  });
};

export const useResellerDeals = () =>
  useQuery({ queryKey: ['rp', 'deals'], queryFn: () => api.fetchDeals() });

export const useRegisterDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.registerDeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rp', 'deals'] }),
  });
};

// ── MDF (Phase 3, Regional Partner tier) ────────────────────────
export const useResellerMdfSummary = () =>
  useQuery({ queryKey: ['rp', 'mdf-summary'], queryFn: api.fetchMdfSummary });

export const useResellerMdfClaims = (params?: any) =>
  useQuery({ queryKey: ['rp', 'mdf-claims', params], queryFn: () => api.fetchMdfClaims(params) });

export const useSubmitMdfClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.submitMdfClaim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rp', 'mdf-claims'] });
      qc.invalidateQueries({ queryKey: ['rp', 'mdf-summary'] });
    },
  });
};

// ── Branding (Phase 3, Regional Partner tier) — self-serve ──────
export const useResellerBranding = () =>
  useQuery({ queryKey: ['rp', 'branding'], queryFn: api.fetchBranding });

export const useUpdateResellerBranding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateBranding,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rp', 'branding'] }),
  });
};
