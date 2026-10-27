import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as nazraApi from '../services/nazra.api';

const KEYS = {
  paras:    ['nazra', 'paras'],
  summary:  ['nazra', 'summary'],
  class:    (grade?: string, section?: string) => ['nazra', 'class', grade, section],
  progress: (studentId: string) => ['nazra', 'progress', studentId],
  report:   (studentId: string) => ['nazra', 'report', studentId],
};

export const useNazraParas = () =>
  useQuery({ queryKey: KEYS.paras, queryFn: nazraApi.fetchParas, staleTime: Infinity });

export const useNazraSummary = () =>
  useQuery({ queryKey: KEYS.summary, queryFn: nazraApi.fetchSummary });

export const useNazraClassProgress = (grade?: string, section?: string, campusId?: string) =>
  useQuery({
    queryKey: KEYS.class(grade, section),
    queryFn: () => nazraApi.fetchClassProgress(grade!, section, campusId),
    enabled: !!grade,
  });

export const useNazraProgress = (studentId: string) =>
  useQuery({
    queryKey: KEYS.progress(studentId),
    queryFn: () => nazraApi.fetchProgress(studentId),
    enabled: !!studentId,
    retry: false, // 404 (no progress yet) is an expected, handled state - not worth retrying
  });

export const useNazraReport = (studentId: string, enabled = true) =>
  useQuery({
    queryKey: KEYS.report(studentId),
    queryFn: () => nazraApi.fetchReport(studentId),
    enabled: !!studentId && enabled,
  });

function invalidateStudent(qc: ReturnType<typeof useQueryClient>, studentId: string) {
  qc.invalidateQueries({ queryKey: KEYS.progress(studentId) });
  qc.invalidateQueries({ queryKey: KEYS.report(studentId) });
  qc.invalidateQueries({ queryKey: ['nazra', 'class'] });
  qc.invalidateQueries({ queryKey: KEYS.summary });
}

export const useInitNazraProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: Parameters<typeof nazraApi.initProgress>[1] }) =>
      nazraApi.initProgress(studentId, data),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};

export const useRecordNazraDiaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: nazraApi.RecordDiaryInput }) =>
      nazraApi.recordDiaryEntry(studentId, data),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};

export const useUpdateParaStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, paraNumber, status }: { studentId: string; paraNumber: number; status: string }) =>
      nazraApi.updateParaStatus(studentId, paraNumber, status),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};

export const useUpdateNazraRemarks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, remarks }: { studentId: string; remarks: string }) =>
      nazraApi.updateOverallRemarks(studentId, remarks),
    onSuccess: (_d, { studentId }) => invalidateStudent(qc, studentId),
  });
};
