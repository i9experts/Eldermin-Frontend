import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as procApi from '../services/procurement.api';

const K = {
  dashboard: ['procurement', 'dashboard'] as const,
  vendors: (p?: any) => ['procurement', 'vendors', p] as const,
  prs: (p?: any) => ['procurement', 'requests', p] as const,
  pos: (p?: any) => ['procurement', 'orders', p] as const,
  grns: (p?: any) => ['procurement', 'grn', p] as const,
  inventory: (p?: any) => ['procurement', 'inventory', p] as const,
  inventorySummary: ['procurement', 'inventory', 'summary'] as const,
};

export const useProcurementDashboard = () =>
  useQuery({ queryKey: K.dashboard, queryFn: procApi.fetchDashboard });

export const useVendors = (params?: any) =>
  useQuery({ queryKey: K.vendors(params), queryFn: () => procApi.fetchVendors(params) });

export const useCreateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createVendor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'vendors'] }),
  });
};

export const useUpdateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.updateVendor(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'vendors'] }),
  });
};

export const usePRs = (params?: any) =>
  useQuery({ queryKey: K.prs(params), queryFn: () => procApi.fetchPRs(params) });

export const useCreatePR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createPR,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'requests'] }),
  });
};

export const useApprovePR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => procApi.approvePR(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'requests'] }),
  });
};

export const useRejectPR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.rejectPR(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'requests'] }),
  });
};

export const usePOs = (params?: any) =>
  useQuery({ queryKey: K.pos(params), queryFn: () => procApi.fetchPOs(params) });

export const useCreatePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createPO,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'orders'] }),
  });
};

export const useGRNs = (params?: any) =>
  useQuery({ queryKey: K.grns(params), queryFn: () => procApi.fetchGRNs(params) });

export const useCreateGRN = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createGRN,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'grn'] }),
  });
};

export const useVerifyGRN = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procApi.verifyGRN(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'grn'] }),
  });
};

export const useInventory = (params?: any) =>
  useQuery({ queryKey: K.inventory(params), queryFn: () => procApi.fetchInventory(params) });

export const useCreateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createInventoryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'inventory'] }),
  });
};

export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.adjustStock(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'inventory'] }),
  });
};

export const useInventorySummary = () =>
  useQuery({ queryKey: K.inventorySummary, queryFn: procApi.getInventorySummary });
