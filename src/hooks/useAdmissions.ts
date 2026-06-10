import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as admApi from '../services/admissions.api';

const KEYS = {
  dashboard: (ay?: string) => ['admissions', 'dashboard', ay],
  leads:     (p?: any)     => ['admissions', 'leads', p],
  applicants:(p?: any)     => ['admissions', 'applicants', p],
  tests:     (p?: any)     => ['admissions', 'tests', p],
  interviews:(p?: any)     => ['admissions', 'interviews', p],
  enrollments:(p?: any)    => ['admissions', 'enrollments', p],
  retention: (p?: any)     => ['admissions', 'retention', p],
  report:    (p?: any)     => ['admissions', 'report', p],
};

// ── Dashboard ─────────────────────────────────────────────────
export const useAdmissionDashboard = (academicYear?: string) =>
  useQuery({
    queryKey: KEYS.dashboard(academicYear),
    queryFn: () => admApi.fetchDashboard(academicYear),
  });

// ── Leads ─────────────────────────────────────────────────────
export const useLeads = (params?: any) =>
  useQuery({
    queryKey: KEYS.leads(params),
    queryFn: () => admApi.fetchLeads({ limit: 200, ...params }),
  });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: admApi.createLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'leads'] }),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.updateLead(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'leads'] }),
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => admApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'leads'] }),
  });
};

export const useConvertLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.convertLead(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions', 'leads'] });
      qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] });
      qc.invalidateQueries({ queryKey: ['admissions', 'dashboard'] });
    },
  });
};

// ── Applicants ────────────────────────────────────────────────
export const useApplicants = (params?: any) =>
  useQuery({
    queryKey: KEYS.applicants(params),
    queryFn: () => admApi.fetchApplicants({ limit: 200, ...params }),
  });

export const useCreateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: admApi.createApplicant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] }),
  });
};

export const useUpdateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.updateApplicant(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] }),
  });
};

export const useUpdateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, documentId, status, remarks }: { applicantId: string; documentId: string; status: string; remarks?: string }) =>
      admApi.updateDocument(applicantId, documentId, status, remarks),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] }),
  });
};

// ── Entrance Tests ────────────────────────────────────────────
export const useTests = (params?: any) =>
  useQuery({
    queryKey: KEYS.tests(params),
    queryFn: () => admApi.fetchTests(params),
  });

export const useCreateTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: admApi.createTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'tests'] }),
  });
};

export const useSubmitTestResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.submitTestResult(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions', 'tests'] });
      qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] });
    },
  });
};

// ── Interviews ────────────────────────────────────────────────
export const useInterviews = (params?: any) =>
  useQuery({
    queryKey: KEYS.interviews(params),
    queryFn: () => admApi.fetchInterviews(params),
  });

export const useCreateInterview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: admApi.createInterview,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'interviews'] }),
  });
};

export const useSubmitInterviewResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.submitInterviewResult(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions', 'interviews'] });
      qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] });
    },
  });
};

// ── Enrollments ───────────────────────────────────────────────
export const useEnrollments = (params?: any) =>
  useQuery({
    queryKey: KEYS.enrollments(params),
    queryFn: () => admApi.fetchEnrollments(params),
  });

export const useCreateEnrollment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: admApi.createEnrollment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions', 'enrollments'] });
      qc.invalidateQueries({ queryKey: ['admissions', 'applicants'] });
    },
  });
};

export const useUpdateEnrollment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.updateEnrollment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'enrollments'] }),
  });
};

// ── Retention ─────────────────────────────────────────────────
export const useRetention = (params?: any) =>
  useQuery({
    queryKey: KEYS.retention(params),
    queryFn: () => admApi.fetchRetention(params),
  });

export const useUpdateRetention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => admApi.updateRetention(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions', 'retention'] }),
  });
};

// ── Reports ───────────────────────────────────────────────────
export const useAdmissionReport = (params: any) =>
  useQuery({
    queryKey: KEYS.report(params),
    queryFn: () => admApi.fetchReport(params),
    enabled: !!params?.academicYear,
  });
