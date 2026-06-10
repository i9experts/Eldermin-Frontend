import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/students.api';

const K = {
  dashboard: (ay?: string) => ['students', 'dashboard', ay],
  list: (p?: any) => ['students', 'list', p],
  one: (id: string) => ['students', id],
  s360: (id: string) => ['students', id, '360'],
  attendance: (p?: any) => ['students', 'attendance', p],
  attSummary: (id: string, m?: string) => ['students', id, 'attendance', m],
  fees: (p?: any) => ['students', 'fees', p],
  feeStatement: (id: string) => ['students', id, 'fees'],
  behaviour: (p?: any) => ['students', 'behaviour', p],
  results: (id: string) => ['students', id, 'results'],
};

// Dashboard
export const useStudentDashboard = (academicYear?: string) =>
  useQuery({ queryKey: K.dashboard(academicYear), queryFn: () => api.fetchStudentDashboard(academicYear) });

// Students list
export const useStudents = (params?: any) =>
  useQuery({ queryKey: K.list(params), queryFn: () => api.fetchStudents(params) });

// Single student
export const useStudent = (id: string) =>
  useQuery({ queryKey: K.one(id), queryFn: () => api.fetchStudentById(id), enabled: !!id });

// Student 360
export const useStudent360 = (id: string) =>
  useQuery({ queryKey: K.s360(id), queryFn: () => api.fetchStudent360(id), enabled: !!id });

// Create student
export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createStudent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', 'list'] }),
  });
};

// Update student
export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateStudent(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: K.one(id) });
      qc.invalidateQueries({ queryKey: ['students', 'list'] });
    },
  });
};

// Attendance
export const useAttendance = (params?: any) =>
  useQuery({ queryKey: K.attendance(params), queryFn: () => api.fetchAttendance(params) });

export const useAttendanceSummary = (studentId: string, month?: string) =>
  useQuery({
    queryKey: K.attSummary(studentId, month),
    queryFn: () => api.fetchAttendanceSummary(studentId, month),
    enabled: !!studentId,
  });

export const useBulkMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.bulkMarkAttendance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', 'attendance'] }),
  });
};

// Fees
export const useFees = (params?: any) =>
  useQuery({ queryKey: K.fees(params), queryFn: () => api.fetchFees(params) });

export const useFeeStatement = (studentId: string) =>
  useQuery({
    queryKey: K.feeStatement(studentId),
    queryFn: () => api.fetchFeeStatement(studentId),
    enabled: !!studentId,
  });

export const useCollectFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.collectFee(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', 'fees'] }),
  });
};

// Behaviour
export const useBehaviour = (params?: any) =>
  useQuery({ queryKey: K.behaviour(params), queryFn: () => api.fetchBehaviour(params) });

export const useStudentBehaviour = (studentId: string) =>
  useQuery({
    queryKey: [...K.behaviour(), studentId],
    queryFn: () => api.fetchStudentBehaviour(studentId),
    enabled: !!studentId,
  });

export const useCreateBehaviour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBehaviour,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', 'behaviour'] }),
  });
};

// Results
export const useStudentResults = (studentId: string) =>
  useQuery({
    queryKey: K.results(studentId),
    queryFn: () => api.fetchStudentResults(studentId),
    enabled: !!studentId,
  });

export const useCreateResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createResult,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', 'results'] }),
  });
};
