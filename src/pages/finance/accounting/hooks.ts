import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import accountingIntegrationsApi from './api';

const K = {
  connection: ['accounting-integrations', 'quickbooks', 'connection'] as const,
  externalAccounts: ['accounting-integrations', 'quickbooks', 'external-accounts'] as const,
  internalAccounts: ['accounting-integrations', 'quickbooks', 'internal-accounts'] as const,
  syncLog: ['accounting-integrations', 'quickbooks', 'sync-log'] as const,
};

export const useQboConnection = () =>
  useQuery({ queryKey: K.connection, queryFn: accountingIntegrationsApi.getConnection });

export const useConnectQuickBooks = () =>
  useMutation({ mutationFn: accountingIntegrationsApi.getConnectUrl });

export const useDisconnectQuickBooks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountingIntegrationsApi.disconnect,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.connection }),
  });
};

export const useQboExternalAccounts = (enabled: boolean) =>
  useQuery({ queryKey: K.externalAccounts, queryFn: accountingIntegrationsApi.getExternalAccounts, enabled });

export const useInternalAccounts = (enabled: boolean) =>
  useQuery({ queryKey: K.internalAccounts, queryFn: accountingIntegrationsApi.getInternalAccounts, enabled });

export const useSaveAccountMappings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountingIntegrationsApi.saveAccountMappings,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.connection }),
  });
};

export const useSetAutoSync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountingIntegrationsApi.setAutoSync,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.connection }),
  });
};

export const useQboSyncLog = (enabled: boolean) =>
  useQuery({ queryKey: K.syncLog, queryFn: () => accountingIntegrationsApi.getSyncLog(100), enabled, refetchInterval: enabled ? 30000 : false });

export const useSyncNow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountingIntegrationsApi.syncNow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.syncLog });
      qc.invalidateQueries({ queryKey: K.connection });
    },
  });
};

export const useRetrySync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (syncLogId: string) => accountingIntegrationsApi.retryOne(syncLogId),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.syncLog }),
  });
};
