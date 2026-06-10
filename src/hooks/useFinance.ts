import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/finance.api';

const K = {
  dashboard:     ['finance', 'dashboard'] as const,
  coa:           ['finance', 'coa'] as const,
  feeStructures: (p?: any) => ['finance', 'fee-structures', p] as const,
  invoices:      (p?: any) => ['finance', 'invoices', p] as const,
  expenses:      (p?: any) => ['finance', 'expenses', p] as const,
  budgets:       (ay?: string) => ['finance', 'budgets', ay] as const,
  banks:         ['finance', 'bank-accounts'] as const,
};

export const useFinanceDashboard = () =>
  useQuery({ queryKey: K.dashboard, queryFn: api.fetchDashboard });

export const useCOA = () =>
  useQuery({ queryKey: K.coa, queryFn: api.fetchCOA });

export const useSeedCOA = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.seedCOA,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.coa }),
  });
};

export const useCreateCOAAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCOAAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.coa }),
  });
};

export const useFeeStructures = (params?: { grade?: string; year?: string }) =>
  useQuery({ queryKey: K.feeStructures(params), queryFn: () => api.fetchFeeStructures(params) });

export const useCreateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'fee-structures'] }),
  });
};

export const useInvoices = (params?: { status?: string; grade?: string }) =>
  useQuery({ queryKey: K.invoices(params), queryFn: () => api.fetchInvoices(params) });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'invoices'] }),
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: any }) => api.recordPayment(invoiceId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'invoices'] }),
  });
};

export const useExpenses = (params?: { status?: string; category?: string }) =>
  useQuery({ queryKey: K.expenses(params), queryFn: () => api.fetchExpenses(params) });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }),
  });
};

export const useApproveExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.approveExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }),
  });
};

export const usePayExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.payExpense(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }),
  });
};

export const useBudgets = (academicYear?: string) =>
  useQuery({ queryKey: K.budgets(academicYear), queryFn: () => api.fetchBudgets(academicYear) });

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
  });
};

export const useApproveBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.approveBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
  });
};

export const useBankAccounts = () =>
  useQuery({ queryKey: K.banks, queryFn: api.fetchBankAccounts });

export const useCreateBankAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBankAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.banks }),
  });
};

export const useUpdateBankBalance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, balance }: { id: string; balance: number }) => api.updateBankBalance(id, balance),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.banks }),
  });
};
