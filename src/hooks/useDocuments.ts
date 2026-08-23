import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import documentsService from '../services/documents.service';

const K = {
  dashboard: ['docs', 'dashboard'] as const,
  docs:      (p?: any) => ['docs', 'list', p] as const,
  templates: (type?: string) => ['docs', 'templates', type] as const,
  workflows: (p?: any) => ['docs', 'workflows', p] as const,
  approvals: ['docs', 'approvals'] as const,
};

export const useDocsDashboard = () =>
  useQuery({ queryKey: K.dashboard, queryFn: documentsService.getDashboard });

export const useDocuments = (params?: { category?: string; status?: string; search?: string }) =>
  useQuery({ queryKey: K.docs(params), queryFn: () => documentsService.getDocuments(params) });

export const useCreateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsService.createDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'list'] }),
  });
};

export const useArchiveDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsService.archiveDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'list'] }),
  });
};

export const useIncrementView = () =>
  useMutation({ mutationFn: documentsService.incrementView });

export const useWorkflowTemplates = (type?: string) =>
  useQuery({ queryKey: K.templates(type), queryFn: () => documentsService.getWorkflowTemplates(type) });

export const useCreateWorkflowTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsService.createWorkflowTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'templates'] }),
  });
};

export const useSeedWorkflowTemplates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsService.seedWorkflowTemplates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'templates'] }),
  });
};

export const useWorkflows = (params?: { status?: string; type?: string }) =>
  useQuery({ queryKey: K.workflows(params), queryFn: () => documentsService.getWorkflows(params) });

export const useMyApprovals = () =>
  useQuery({ queryKey: K.approvals, queryFn: documentsService.getMyApprovals });

export const useInitiateWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsService.initiateWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'workflows'] }),
  });
};

export const useTakeAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentsService.takeAction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docs', 'workflows'] });
      qc.invalidateQueries({ queryKey: K.approvals });
    },
  });
};

export const useCancelWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => documentsService.cancelWorkflow(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'workflows'] }),
  });
};
