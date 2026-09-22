import api from '../../../lib/api';

const BASE = '/academics/accounting-integrations';

const accountingIntegrationsApi = {
  getConnection: async () => { const { data } = await api.get(`${BASE}/quickbooks/connection`); return data; },
  getConnectUrl: async () => { const { data } = await api.post(`${BASE}/quickbooks/connect-url`); return data; },
  disconnect: async () => { const { data } = await api.post(`${BASE}/quickbooks/disconnect`); return data; },

  getExternalAccounts: async () => { const { data } = await api.get(`${BASE}/quickbooks/external-accounts`); return data; },
  getInternalAccounts: async () => { const { data } = await api.get(`${BASE}/quickbooks/internal-accounts`); return data; },
  saveAccountMappings: async (mappings: any[]) => { const { data } = await api.patch(`${BASE}/quickbooks/account-mappings`, { mappings }); return data; },
  setAutoSync: async (enabled: boolean) => { const { data } = await api.patch(`${BASE}/quickbooks/auto-sync`, { enabled }); return data; },

  getSyncLog: async (limit = 100) => { const { data } = await api.get(`${BASE}/quickbooks/sync-log`, { params: { limit } }); return data; },
  syncNow: async () => { const { data } = await api.post(`${BASE}/quickbooks/sync-now`); return data; },
  retryOne: async (syncLogId: string) => { const { data } = await api.post(`${BASE}/quickbooks/sync-log/${syncLogId}/retry`); return data; },
};

export default accountingIntegrationsApi;
