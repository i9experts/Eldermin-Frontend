import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import libraryApi from './api';

const K = {
  settings: ['library', 'settings'] as const,
  books: (p?: any) => ['library', 'books', p] as const,
  book: (id?: string) => ['library', 'books', 'detail', id] as const,
  issues: (p?: any) => ['library', 'issues', p] as const,
  reservations: (p?: any) => ['library', 'reservations', p] as const,
  overdue: ['library', 'overdue'] as const,
  defaulters: ['library', 'reports', 'defaulters'] as const,
  mostBorrowed: (limit?: number) => ['library', 'reports', 'most-borrowed', limit] as const,
  circulation: ['library', 'reports', 'circulation-by-category'] as const,
};

// ── Settings ──────────────────────────────────────────────────────
export const useLibrarySettings = () =>
  useQuery({ queryKey: K.settings, queryFn: libraryApi.getSettings });

export const useUpdateLibrarySettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: libraryApi.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.settings }),
  });
};

// ── Books ─────────────────────────────────────────────────────────
export const useBooks = (params?: any) =>
  useQuery({ queryKey: K.books(params), queryFn: () => libraryApi.getBooks(params) });

export const useBook = (id?: string) =>
  useQuery({ queryKey: K.book(id), queryFn: () => libraryApi.getBookById(id as string), enabled: !!id });

export const useCreateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: libraryApi.createBook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: K.overdue });
    },
  });
};

export const useUpdateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => libraryApi.updateBook(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: K.book(vars.id) });
    },
  });
};

export const useDeaccessionBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, copyAccessionNo }: { id: string; copyAccessionNo?: string }) =>
      libraryApi.deaccessionBook(id, copyAccessionNo),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: K.book(vars.id) });
    },
  });
};

// ── Issues ────────────────────────────────────────────────────────
export const useIssues = (params?: any) =>
  useQuery({ queryKey: K.issues(params), queryFn: () => libraryApi.getIssues(params) });

export const useIssueBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: libraryApi.issueBook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'issues'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: K.overdue });
    },
  });
};

export const useReturnBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data?: any }) => libraryApi.returnBook(issueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'issues'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: K.overdue });
    },
  });
};

export const useRenewIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => libraryApi.renewIssue(issueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'issues'] });
      qc.invalidateQueries({ queryKey: K.overdue });
    },
  });
};

export const useMarkFinePaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => libraryApi.markFinePaid(issueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'issues'] });
      qc.invalidateQueries({ queryKey: K.overdue });
    },
  });
};

export const useMarkLost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data?: { replacementCharge?: number; notes?: string } }) => libraryApi.markLost(issueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'issues'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: K.overdue });
    },
  });
};

export const useMarkDamaged = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data?: { notes?: string } }) => libraryApi.markDamaged(issueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'issues'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
    },
  });
};

// ── Reservations ──────────────────────────────────────────────────
export const useReservations = (params?: any) =>
  useQuery({ queryKey: K.reservations(params), queryFn: () => libraryApi.getReservations(params) });

export const useCreateReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: libraryApi.createReservation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library', 'reservations'] }),
  });
};

export const useCancelReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.cancelReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library', 'reservations'] }),
  });
};

// ── Overdue ───────────────────────────────────────────────────────
export const useOverdueIssues = () =>
  useQuery({ queryKey: K.overdue, queryFn: libraryApi.getOverdue });

// ── Reports ───────────────────────────────────────────────────────
export const useDefaultersReport = () =>
  useQuery({ queryKey: K.defaulters, queryFn: libraryApi.getDefaultersReport });

export const useMostBorrowedReport = (limit = 10) =>
  useQuery({ queryKey: K.mostBorrowed(limit), queryFn: () => libraryApi.getMostBorrowedReport(limit) });

export const useCirculationByCategoryReport = () =>
  useQuery({ queryKey: K.circulation, queryFn: libraryApi.getCirculationByCategoryReport });
