import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as visitRecordsApi from '../services/visitRecords.api';
import type { VisitRecordPayload } from '../services/visitRecords.api';

const KEYS = {
  list: (params?: any) => ['visit-records', 'list', params] as const,
  stats: ['visit-records', 'stats'] as const,
  detail: (id: string) => ['visit-records', 'detail', id] as const,
};

export const useVisitRecords = (params?: {
  institutionType?: string; elderminInterest?: string; smartvanInterest?: string;
  pendingFollowUp?: boolean; search?: string;
}) => useQuery({ queryKey: KEYS.list(params), queryFn: () => visitRecordsApi.getVisitRecords(params) });

export const useVisitRecordStats = () =>
  useQuery({ queryKey: KEYS.stats, queryFn: visitRecordsApi.getVisitRecordStats });

export const useVisitRecord = (id: string) =>
  useQuery({ queryKey: KEYS.detail(id), queryFn: () => visitRecordsApi.getVisitRecord(id), enabled: !!id });

export const useCreateVisitRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VisitRecordPayload) => visitRecordsApi.createVisitRecord(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-records', 'list'] });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};

export const useUpdateVisitRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VisitRecordPayload> }) =>
      visitRecordsApi.updateVisitRecord(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['visit-records', 'list'] });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};

export const useUploadVisitRecordPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => visitRecordsApi.uploadVisitRecordPhoto(id, file),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['visit-records', 'list'] });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
};

export const useAddVisitRecordFollowUpNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => visitRecordsApi.addVisitRecordFollowUpNote(id, text),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
      qc.invalidateQueries({ queryKey: ['visit-records', 'list'] });
    },
  });
};

export const useDeleteVisitRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitRecordsApi.deleteVisitRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-records', 'list'] });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};
