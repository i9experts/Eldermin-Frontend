import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/documents.api';

const K = {
  dashboard: ['docs', 'dashboard'] as const,
  docs:      (p?: any) => ['docs', 'list', p] as const,
  templates: (type?: string) => ['docs', 'templates', type] as const,
  workflows: (p?: any) => ['docs', 'workflows', p] as const,
  approvals: ['docs', 'approvals'] as const,
};

export const useDocsDashboard = () =>
  useQuery({ queryKey: K.dashboard, queryFn: api.fetchDashboard });

export const useDocuments = (params?: { category?: string; status?: string; search?: string }) =>
  useQuery({ queryKey: K.docs(params), queryFn: () => api.fetchDocuments(params) });

export const useCreateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'list'] }),
  });
};

export const useArchiveDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.archiveDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'list'] }),
  });
};

export const useIncrementView = () =>
  useMutation({ mutationFn: api.incrementView });

export const useWorkflowTemplates = (type?: string) =>
  useQuery({ queryKey: K.templates(type), queryFn: () => api.fetchWorkflowTemplates(type) });

export const useCreateWorkflowTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createWorkflowTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'templates'] }),
  });
};

export const useSeedWorkflowTemplates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.seedWorkflowTemplates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'templates'] }),
  });
};

export const useWorkflows = (params?: { status?: string; type?: string }) =>
  useQuery({ queryKey: K.workflows(params), queryFn: () => api.fetchWorkflows(params) });

export const useMyApprovals = () =>
  useQuery({ queryKey: K.approvals, queryFn: api.fetchMyApprovals });

export const useInitiateWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.initiateWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'workflows'] }),
  });
};

export const useTakeAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.takeAction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docs', 'workflows'] });
      qc.invalidateQueries({ queryKey: K.approvals });
    },
  });
};

export const useCancelWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.cancelWorkflow(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'workflows'] }),
  });
};
