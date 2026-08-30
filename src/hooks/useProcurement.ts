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
  assets: (p?: any) => ['procurement', 'assets', p] as const,
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

export const useUpdatePR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.updatePR(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'requests'] }),
  });
};

export const useSubmitPR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procApi.submitPR(id),
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

export const useUpdateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.updateInventoryItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'inventory'] }),
  });
};

export const useDeleteInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procApi.deleteInventoryItem(id),
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

// ─── ASSETS ─────────────────────────────────────────────────────────────────
export const useAssets = (params?: any) =>
  useQuery({ queryKey: K.assets(params), queryFn: () => procApi.fetchAssets(params) });

export const useCreateAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'assets'] }),
  });
};

export const useUpdateAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.updateAsset(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'assets'] }),
  });
};

export const useDeleteAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procApi.deleteAsset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'assets'] }),
  });
};

// ─── MASTER SETTINGS ────────────────────────────────────────────────────────
// One list/create/update/delete hook set per settings resource, mirroring
// academics' useSubjectCategories - every Master Settings panel and every
// dropdown that used to read from the old hardcoded VENDOR_CATS/ITEM_CATS/
// ASSET_CATS/UOM_OPTIONS/PAYMENT_TERMS_LIST/DEPRECIATION_METHODS arrays
// reads from these instead.
type SettingsResource = {
  fetch: (params?: any) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<any>;
};

function makeSettingsHooks(queryKey: string, resource: SettingsResource) {
  const key = (includeInactive?: boolean) => ['procurement', 'settings', queryKey, { includeInactive: !!includeInactive }] as const;
  const useList = (includeInactive = false) =>
    useQuery({ queryKey: key(includeInactive), queryFn: () => resource.fetch(includeInactive ? { includeInactive: 'true' } : undefined) });
  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: resource.create,
      onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'settings', queryKey] }),
    });
  };
  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) => resource.update(id, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'settings', queryKey] }),
    });
  };
  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => resource.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'settings', queryKey] }),
    });
  };
  return { useList, useCreate, useUpdate, useDelete };
}

export const {
  useList: useVendorCategories, useCreate: useCreateVendorCategory,
  useUpdate: useUpdateVendorCategory, useDelete: useDeleteVendorCategory,
} = makeSettingsHooks('vendor-categories', procApi.vendorCategoriesApi);

export const {
  useList: useItemCategories, useCreate: useCreateItemCategory,
  useUpdate: useUpdateItemCategory, useDelete: useDeleteItemCategory,
} = makeSettingsHooks('item-categories', procApi.itemCategoriesApi);

export const {
  useList: useAssetCategories, useCreate: useCreateAssetCategory,
  useUpdate: useUpdateAssetCategory, useDelete: useDeleteAssetCategory,
} = makeSettingsHooks('asset-categories', procApi.assetCategoriesApi);

export const {
  useList: useUnitsOfMeasure, useCreate: useCreateUnitOfMeasure,
  useUpdate: useUpdateUnitOfMeasure, useDelete: useDeleteUnitOfMeasure,
} = makeSettingsHooks('units-of-measure', procApi.unitsOfMeasureApi);

export const {
  useList: usePaymentTerms, useCreate: useCreatePaymentTerm,
  useUpdate: useUpdatePaymentTerm, useDelete: useDeletePaymentTerm,
} = makeSettingsHooks('payment-terms', procApi.paymentTermsApi);

export const {
  useList: useDepreciationMethods, useCreate: useCreateDepreciationMethod,
  useUpdate: useUpdateDepreciationMethod, useDelete: useDeleteDepreciationMethod,
} = makeSettingsHooks('depreciation-methods', procApi.depreciationMethodsApi);

export const useSeedProcurementSettingsDefaults = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.seedSettingsDefaults,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'settings'] }),
  });
};

// ─── REPORTS ────────────────────────────────────────────────────────────────
export const useReportData = (key: string | null, params?: procApi.ReportFilterParams) =>
  useQuery({
    queryKey: ['procurement', 'reports', key, params],
    queryFn: () => procApi.fetchReportData(key as string, params),
    enabled: !!key,
  });

export const useDownloadReportExport = () =>
  useMutation({
    mutationFn: ({ key, format, filenameBase, params }: { key: string; format: 'pdf' | 'excel' | 'csv'; filenameBase: string; params?: procApi.ReportFilterParams }) =>
      procApi.downloadReportExport(key, format, filenameBase, params),
  });

// ─── SCHEDULED REPORTS ──────────────────────────────────────────────────────
export const useScheduledReports = (params?: any) =>
  useQuery({ queryKey: ['procurement', 'scheduled-reports', params], queryFn: () => procApi.fetchScheduledReports(params) });

export const useCreateScheduledReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procApi.createScheduledReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'scheduled-reports'] }),
  });
};

export const useUpdateScheduledReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => procApi.updateScheduledReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'scheduled-reports'] }),
  });
};

export const useDeleteScheduledReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procApi.deleteScheduledReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'scheduled-reports'] }),
  });
};

export const useRunScheduledReportNow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procApi.runScheduledReportNow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement', 'scheduled-reports'] }),
  });
};
