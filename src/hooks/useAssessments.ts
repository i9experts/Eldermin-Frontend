import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as assessmentApi from '../services/assessment.api';

const KEYS = {
  dashboard:   (ay?: string)             => ['assessments', 'dashboard', ay],
  list:        (p?: any)                 => ['assessments', 'list', p],
  one:         (id: string)              => ['assessments', 'one', id],
  questions:   (p?: any)                 => ['assessments', 'questions', p],
  marks:       (p?: any)                 => ['assessments', 'marks', p],
  reportCards: (p?: any)                 => ['assessments', 'reportCards', p],
  analytics:   (ay: string, g?: string)  => ['assessments', 'analytics', ay, g],
};

// ── Dashboard ─────────────────────────────────────────────────
export const useAssessmentDashboard = (academicYear?: string) =>
  useQuery({
    queryKey: KEYS.dashboard(academicYear),
    queryFn: () => assessmentApi.fetchDashboard(academicYear),
  });

// ── Assessments ───────────────────────────────────────────────
export const useAssessments = (params?: any) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => assessmentApi.fetchAssessments(params),
  });

export const useAssessmentById = (id: string) =>
  useQuery({
    queryKey: KEYS.one(id),
    queryFn: () => assessmentApi.fetchAssessmentById(id),
    enabled: !!id,
  });

export const useCreateAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assessmentApi.createAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments', 'list'] });
      qc.invalidateQueries({ queryKey: ['assessments', 'dashboard'] });
    },
  });
};

export const useUpdateAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assessmentApi.updateAssessment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'list'] }),
  });
};

export const useUpdateAssessmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      assessmentApi.updateAssessmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments', 'list'] });
      qc.invalidateQueries({ queryKey: ['assessments', 'dashboard'] });
    },
  });
};

// ── Questions ─────────────────────────────────────────────────
export const useQuestions = (params?: any) =>
  useQuery({
    queryKey: KEYS.questions(params),
    queryFn: () => assessmentApi.fetchQuestions(params),
  });

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assessmentApi.createQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'questions'] }),
  });
};

export const useDeleteQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentApi.deleteQuestion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'questions'] }),
  });
};

// ── Marks ─────────────────────────────────────────────────────
export const useMarks = (params?: any) =>
  useQuery({
    queryKey: KEYS.marks(params),
    queryFn: () => assessmentApi.fetchMarks(params),
  });

export const useBulkEnterMarks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assessmentApi.bulkEnterMarks,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'marks'] }),
  });
};

export const useVerifyMarks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assessmentApi.verifyMarks,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'marks'] }),
  });
};

// ── Report Cards ──────────────────────────────────────────────
export const useReportCards = (params?: any) =>
  useQuery({
    queryKey: KEYS.reportCards(params),
    queryFn: () => assessmentApi.fetchReportCards(params),
  });

export const useGenerateReportCards = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assessmentApi.generateReportCards,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments', 'reportCards'] });
      qc.invalidateQueries({ queryKey: ['assessments', 'list'] });
    },
  });
};

export const usePublishResults = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assessmentApi.publishResults,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments', 'reportCards'] });
      qc.invalidateQueries({ queryKey: ['assessments', 'dashboard'] });
    },
  });
};

// ── Analytics ─────────────────────────────────────────────────
export const useAnalytics = (academicYear: string, grade?: string) =>
  useQuery({
    queryKey: KEYS.analytics(academicYear, grade),
    queryFn: () => assessmentApi.fetchAnalytics(academicYear, grade),
    enabled: !!academicYear,
  });
