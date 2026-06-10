import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/organization.api';

const K = {
  profile:      ['org', 'profile'] as const,
  overview:     ['org', 'overview'] as const,
  campuses:     ['org', 'campuses'] as const,
  years:        ['org', 'years'] as const,
  grades:       (campusId?: string) => ['org', 'grades', campusId] as const,
  departments:  ['org', 'departments'] as const,
  designations: (category?: string) => ['org', 'designations', category] as const,
};

export const useOrgProfile = () =>
  useQuery({ queryKey: K.profile, queryFn: api.fetchProfile });

export const useOrgOverview = () =>
  useQuery({ queryKey: K.overview, queryFn: api.fetchOverview });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.profile }),
  });
};

export const useCampuses = () =>
  useQuery({ queryKey: K.campuses, queryFn: api.fetchCampuses });

export const useCreateCampus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCampus,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.campuses }),
  });
};

export const useUpdateCampus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCampus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.campuses }),
  });
};

export const useDeleteCampus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCampus,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.campuses }),
  });
};

export const useAcademicYears = () =>
  useQuery({ queryKey: K.years, queryFn: api.fetchAcademicYears });

export const useCreateAcademicYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAcademicYear,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.years }),
  });
};

export const useSetCurrentYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.setCurrentYear,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.years }),
  });
};

export const useGrades = (campusId?: string) =>
  useQuery({ queryKey: K.grades(campusId), queryFn: () => api.fetchGrades(campusId) });

export const useCreateGrade = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createGrade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', 'grades'] }),
  });
};

export const useSeedGrades = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.seedGrades,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', 'grades'] }),
  });
};

export const useAddSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.addSection(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', 'grades'] }),
  });
};

export const useDepartments = () =>
  useQuery({ queryKey: K.departments, queryFn: api.fetchDepartments });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.departments }),
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateDepartment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.departments }),
  });
};

export const useDesignations = (category?: string) =>
  useQuery({ queryKey: K.designations(category), queryFn: () => api.fetchDesignations(category) });

export const useCreateDesignation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDesignation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', 'designations'] }),
  });
};
