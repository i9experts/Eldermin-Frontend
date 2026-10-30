import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/qaidaNazraExtras.api';

const KEYS = {
  settings:     ['qaidaNazraExtras', 'settings'],
  invigilator:  (studentId: string, program?: string) => ['qaidaNazraExtras', 'invigilator', studentId, program],
  homeLog:      (studentId: string, program?: string) => ['qaidaNazraExtras', 'homeLog', studentId, program],
};

// One shared settings doc covers both Qaida and Nazra (invigilator KPIs +
// the Nazra reverse-order toggle) - see QaidaNazraSettings on the backend.
export const useQaidaNazraSettings = () =>
  useQuery({ queryKey: KEYS.settings, queryFn: api.fetchSettings, staleTime: 60_000 });

export const useUpdateQaidaNazraSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.settings }),
  });
};

export const useInvigilatorAssessments = (studentId: string, program?: 'qaida' | 'nazra') =>
  useQuery({
    queryKey: KEYS.invigilator(studentId, program),
    queryFn: () => api.fetchInvigilatorAssessments(studentId, program),
    enabled: !!studentId,
  });

export const useRecordInvigilatorAssessments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.recordInvigilatorAssessments,
    onSuccess: (_d, vars) => {
      for (const entry of vars.entries) {
        qc.invalidateQueries({ queryKey: KEYS.invigilator(entry.studentId, vars.program) });
      }
    },
  });
};

export const useHomeLog = (studentId: string, program?: 'qaida' | 'nazra') =>
  useQuery({
    queryKey: KEYS.homeLog(studentId, program),
    queryFn: () => api.fetchHomeLog(studentId, program),
    enabled: !!studentId,
  });
