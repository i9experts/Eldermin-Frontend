import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as behaviourApi from '../services/behaviour.api';

const KEYS = {
  dashboard:     (ay?: string)              => ['behaviour', 'dashboard', ay],
  records:       (p?: any)                  => ['behaviour', 'records', p],
  tarbiyah:      (p?: any)                  => ['behaviour', 'tarbiyah', p],
  counselling:   (p?: any)                  => ['behaviour', 'counselling', p],
  interventions: (p?: any)                  => ['behaviour', 'interventions', p],
  contracts:     (p?: any)                  => ['behaviour', 'contracts', p],
  report:        (ay: string, g?: string)   => ['behaviour', 'report', ay, g],
  profile:       (sid: string, ay?: string) => ['behaviour', 'profile', sid, ay],
};

// ── Dashboard ─────────────────────────────────────────────────
export const useBehaviourDashboard = (academicYear?: string) =>
  useQuery({
    queryKey: KEYS.dashboard(academicYear),
    queryFn: () => behaviourApi.fetchDashboard(academicYear),
  });

// ── Records ───────────────────────────────────────────────────
export const useRecords = (params?: any) =>
  useQuery({
    queryKey: KEYS.records(params),
    queryFn: () => behaviourApi.fetchRecords(params),
  });

export const useCreateRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: behaviourApi.createRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behaviour', 'records'] });
      qc.invalidateQueries({ queryKey: ['behaviour', 'dashboard'] });
    },
  });
};

export const useUpdateRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => behaviourApi.updateRecord(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviour', 'records'] }),
  });
};

export const useResolveRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => behaviourApi.resolveRecord(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behaviour', 'records'] });
      qc.invalidateQueries({ queryKey: ['behaviour', 'dashboard'] });
    },
  });
};

// ── Tarbiyah ──────────────────────────────────────────────────
export const useTarbiyah = (params?: any) =>
  useQuery({
    queryKey: KEYS.tarbiyah(params),
    queryFn: () => behaviourApi.fetchTarbiyah(params),
  });

export const useCreateTarbiyah = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: behaviourApi.createTarbiyah,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behaviour', 'tarbiyah'] });
      qc.invalidateQueries({ queryKey: ['behaviour', 'dashboard'] });
    },
  });
};

export const useUpdateTarbiyah = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => behaviourApi.updateTarbiyah(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviour', 'tarbiyah'] }),
  });
};

// ── Counselling ───────────────────────────────────────────────
export const useCounselling = (params?: any) =>
  useQuery({
    queryKey: KEYS.counselling(params),
    queryFn: () => behaviourApi.fetchCounselling(params),
  });

export const useCreateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: behaviourApi.createSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behaviour', 'counselling'] });
      qc.invalidateQueries({ queryKey: ['behaviour', 'dashboard'] });
    },
  });
};

export const useCompleteSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => behaviourApi.completeSession(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviour', 'counselling'] }),
  });
};

// ── Interventions ─────────────────────────────────────────────
export const useInterventions = (params?: any) =>
  useQuery({
    queryKey: KEYS.interventions(params),
    queryFn: () => behaviourApi.fetchInterventions(params),
  });

export const useCreateIntervention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: behaviourApi.createIntervention,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behaviour', 'interventions'] });
      qc.invalidateQueries({ queryKey: ['behaviour', 'dashboard'] });
    },
  });
};

export const useAddProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => behaviourApi.addProgress(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviour', 'interventions'] }),
  });
};

// ── Contracts ─────────────────────────────────────────────────
export const useContracts = (params?: any) =>
  useQuery({
    queryKey: KEYS.contracts(params),
    queryFn: () => behaviourApi.fetchContracts(params),
  });

export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: behaviourApi.createContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviour', 'contracts'] }),
  });
};

export const useSignContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signedBy }: { id: string; signedBy: string }) =>
      behaviourApi.signContract(id, signedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['behaviour', 'contracts'] }),
  });
};

// ── Report ────────────────────────────────────────────────────
export const useBehaviourReport = (academicYear: string, grade?: string) =>
  useQuery({
    queryKey: KEYS.report(academicYear, grade),
    queryFn: () => behaviourApi.fetchReport({ academicYear, grade }),
    enabled: !!academicYear,
  });

// ── Student Profile ───────────────────────────────────────────
export const useStudentBehaviourProfile = (studentId: string, academicYear?: string) =>
  useQuery({
    queryKey: KEYS.profile(studentId, academicYear),
    queryFn: () => behaviourApi.fetchStudentProfile(studentId, academicYear),
    enabled: !!studentId,
  });
