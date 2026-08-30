import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/compliance.api';

const K = {
  dashboard:    ['compliance', 'dashboard'] as const,
  policies:     (p?: any) => ['compliance', 'policies', p] as const,
  safeguarding: (p?: any) => ['compliance', 'safeguarding', p] as const,
  auditLogs:    (p?: any) => ['compliance', 'audit-logs', p] as const,
  accreditation: ['compliance', 'accreditation'] as const,
  consentRecords: (p?: any) => ['compliance', 'consent-records', p] as const,
  retentionPolicies: (p?: any) => ['compliance', 'retention-policies', p] as const,
  dsar: (p?: any) => ['compliance', 'dsar', p] as const,
  attendanceSettings: ['compliance', 'attendance-settings'] as const,
  attendanceCompliance: (p?: any) => ['compliance', 'attendance-compliance', p] as const,
  governanceRollup: ['compliance', 'governance-rollup'] as const,
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

export const useUpdateAccreditation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAccreditation(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.accreditation }),
  });
};

// ── Data Privacy: Consent Records ────────────────────────────────
export const useConsentRecords = (params?: { subjectType?: string; consentType?: string; status?: string }) =>
  useQuery({ queryKey: K.consentRecords(params), queryFn: () => api.fetchConsentRecords(params) });

export const useCreateConsentRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createConsentRecord,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'consent-records'] }),
  });
};

export const useUpdateConsentRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateConsentRecord(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'consent-records'] }),
  });
};

export const useDeleteConsentRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteConsentRecord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'consent-records'] }),
  });
};

// ── Data Privacy: Retention Policies ─────────────────────────────
export const useRetentionPolicies = (params?: { isActive?: boolean }) =>
  useQuery({ queryKey: K.retentionPolicies(params), queryFn: () => api.fetchRetentionPolicies(params) });

export const useCreateRetentionPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRetentionPolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'retention-policies'] }),
  });
};

export const useUpdateRetentionPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateRetentionPolicy(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'retention-policies'] }),
  });
};

export const useDeleteRetentionPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteRetentionPolicy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'retention-policies'] }),
  });
};

export const useSeedRetentionPolicyDefaults = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.seedRetentionPolicyDefaults,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'retention-policies'] }),
  });
};

// ── Data Privacy: Data Subject Requests (DSAR) ───────────────────
export const useDsarRequests = (params?: { status?: string; requestType?: string; dataSubjectType?: string }) =>
  useQuery({ queryKey: K.dsar(params), queryFn: () => api.fetchDsarRequests(params) });

export const useCreateDsarRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDsarRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'dsar'] }),
  });
};

export const useUpdateDsarRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateDsarRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'dsar'] }),
  });
};

export const useDeleteDsarRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDsarRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'dsar'] }),
  });
};

// ── Attendance Compliance ────────────────────────────────────────
export const useAttendanceSettings = () =>
  useQuery({ queryKey: K.attendanceSettings, queryFn: api.fetchAttendanceSettings });

export const useUpdateAttendanceSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateAttendanceSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.attendanceSettings });
      qc.invalidateQueries({ queryKey: ['compliance', 'attendance-compliance'] });
      qc.invalidateQueries({ queryKey: K.governanceRollup });
    },
  });
};

export const useAttendanceCompliance = (params?: { from?: string; to?: string }) =>
  useQuery({ queryKey: K.attendanceCompliance(params), queryFn: () => api.fetchAttendanceCompliance(params) });

// ── Governance: Multi-Campus Rollup ──────────────────────────────
export const useGovernanceRollup = () =>
  useQuery({ queryKey: K.governanceRollup, queryFn: api.fetchGovernanceRollup });
