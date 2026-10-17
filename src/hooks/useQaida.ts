import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as qaidaApi from '../services/qaida.api';

const KEYS = {
  takhtis:  ['qaida', 'takhtis'],
  summary:  ['qaida', 'summary'],
  class:    (grade?: string, section?: string) => ['qaida', 'class', grade, section],
  progress: (studentId: string) => ['qaida', 'progress', studentId],
  report:   (studentId: string) => ['qaida', 'report', studentId],
};

export const useQaidaTakhtis = () =>
  useQuery({ queryKey: KEYS.takhtis, queryFn: qaidaApi.fetchTakhtis, staleTime: Infinity });

export const useQaidaSummary = () =>
  useQuery({ queryKey: KEYS.summary, queryFn: qaidaApi.fetchSummary });

export const useQaidaClassProgress = (grade?: string, section?: string, campusId?: string) =>
  useQuery({
    queryKey: KEYS.class(grade, section),
    queryFn: () => qaidaApi.fetchClassProgress(grade!, section, campusId),
    enabled: !!grade,
  });

export const useQaidaProgress = (studentId: string) =>
  useQuery({
    queryKey: KEYS.progress(studentId),
    queryFn: () => qaidaApi.fetchProgress(studentId),
    enabled: !!studentId,
    retry: false, // 404 (no progress yet) is an expected, handled state - not worth retrying
  });

export const useQaidaReport = (studentId: string, enabled = true) =>
  useQuery({
    queryKey: KEYS.report(studentId),
    queryFn: () => qaidaApi.fetchReport(studentId),
    enabled: !!studentId && enabled,
  });

function invalidateStudent(qc: ReturnType<typeof useQueryClient>, studentId: string) {
  qc.invalidateQueries({ queryKey: KEYS.progress(studentId) });
  qc.invalidateQueries({ queryKey: KEYS.report(studentId) });
  qc.invalidateQueries({ queryKey: ['qaida', 'class'] });
  qc.invalidateQueries({ queryKey: KEYS.summary });
}

export const useInitQaidaProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: Parameters<typeof qaidaApi.initProgress>[1] }) =>
      qaidaApi.initProgress(studentId, data),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};

export const useRecordTakhtiAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: Parameters<typeof qaidaApi.recordAttempt>[1] }) =>
      qaidaApi.recordAttempt(studentId, data),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};

export const useUpdateTakhtiStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, takhtiNumber, status }: { studentId: string; takhtiNumber: number; status: string }) =>
      qaidaApi.updateTakhtiStatus(studentId, takhtiNumber, status),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};

export const useUpdateQaidaRemarks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, remarks }: { studentId: string; remarks: string }) =>
      qaidaApi.updateOverallRemarks(studentId, remarks),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};
