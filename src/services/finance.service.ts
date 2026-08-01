import api from '../lib/api';

const financeService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboard() {
    const { data } = await api.get('/finance/dashboard');
    return data;
  },

  // ── Chart of Accounts ──────────────────────────────────────────────────────
  async getCOA() {
    const { data } = await api.get('/finance/coa');
    return data;
  },

  async getCOAByType(type: string) {
    const { data } = await api.get('/finance/coa', { params: { type } });
    return data;
  },

  async createCOAAccount(payload: any) {
    const { data } = await api.post('/finance/coa', payload);
    return data;
  },

  async seedCOA() {
    const { data } = await api.post('/finance/coa/seed');
    return data;
  },

  /** Alias used by FeeRevenueTab's "Standard COA" button */
  async applyStandardCOA() {
    const { data } = await api.post('/finance/coa/seed');
    return data;
  },

  async updateCOAAccount(id: string, payload: any) {
    const { data } = await api.patch(`/finance/coa/${id}`, payload);
    return data;
  },

  async deleteCOAAccount(id: string) {
    const { data } = await api.delete(`/finance/coa/${id}`);
    return data;
  },

  // ── Fee Structures ─────────────────────────────────────────────────────────
  async getFeeStructures(grade?: string, year?: string) {
    const { data } = await api.get('/finance/fee-structures', {
      params: { ...(grade && { grade }), ...(year && { year }) },
    });
    return data;
  },

  /** Alias used by FeeRevenueTab which still calls getFeeHeads */
  async getFeeHeads() {
    return financeService.getFeeStructures();
  },

  async createFeeStructure(payload: any) {
    const { data } = await api.post('/finance/fee-structures', payload);
    return data;
  },

  /** Alias used by FeeRevenueTab which still calls createFeeHead */
  async createFeeHead(payload: any) {
    return financeService.createFeeStructure(payload);
  },

  async updateFeeStructure(id: string, payload: any) {
    const { data } = await api.put(`/finance/fee-structures/${id}`, payload);
    return data;
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  /** Backend returns { data, meta } — unwrapped here so callers get a plain array */
  async getInvoices(params?: { status?: string; grade?: string }): Promise<any[]> {
    const { data } = await api.get('/finance/invoices', { params });
    return data?.data ?? [];
  },

  async createInvoice(payload: any) {
    const { data } = await api.post('/finance/invoices', payload);
    return data;
  },

  async recordPayment(invoiceId: string, payload: any) {
    const { data } = await api.post(`/finance/invoices/${invoiceId}/payment`, payload);
    return data;
  },

  /** Collect Fee modal — records a payment against an invoice */
  async collectFee(payload: {
    invoiceId: string; studentId?: string; amount: number; paymentMethod: string;
    paymentDate: string; referenceNumber?: string; remarks?: string;
  }) {
    const { data } = await api.post('/finance/payments', payload);
    return data;
  },

  async getPayments(): Promise<any[]> {
    const { data } = await api.get('/finance/payments');
    return data;
  },

  /** Alias used by PayableTab which still calls createPayment */
  async createPayment(payload: any) {
    if (!payload?.invoiceId) return Promise.resolve(null);
    return financeService.recordPayment(payload.invoiceId, payload);
  },

  // ── Expenses ───────────────────────────────────────────────────────────────
  /** Backend returns { data, meta } — unwrapped here so callers get a plain array */
  async getExpenses(): Promise<any[]> {
    const { data } = await api.get('/finance/expenses');
    return data?.data ?? [];
  },

  async getExpensesFiltered(params: { status?: string; category?: string }): Promise<any[]> {
    const { data } = await api.get('/finance/expenses', { params });
    return data?.data ?? [];
  },

  async createExpense(payload: any) {
    const { data } = await api.post('/finance/expenses', payload);
    return data;
  },

  async approveExpense(id: string) {
    const { data } = await api.patch(`/finance/expenses/${id}/approve`);
    return data;
  },

  async payExpense(id: string, payload: any) {
    const { data } = await api.patch(`/finance/expenses/${id}/pay`, payload);
    return data;
  },

  // ── Budgets ────────────────────────────────────────────────────────────────
  async getBudgets(academicYear?: string) {
    const { data } = await api.get('/finance/budgets', {
      params: academicYear ? { academicYear } : undefined,
    });
    return data;
  },

  async createBudget(payload: any) {
    const { data } = await api.post('/finance/budgets', payload);
    return data;
  },

  async approveBudget(id: string) {
    const { data } = await api.patch(`/finance/budgets/${id}/approve`);
    return data;
  },

  // ── Bank Accounts ──────────────────────────────────────────────────────────
  async getBankAccounts() {
    const { data } = await api.get('/finance/bank-accounts');
    return data;
  },

  async createBankAccount(payload: any) {
    const { data } = await api.post('/finance/bank-accounts', payload);
    return data;
  },

  async updateBankBalance(id: string, balance: number) {
    const { data } = await api.patch(`/finance/bank-accounts/${id}/balance`, { balance });
    return data;
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  async getIncomeStatement(params: { academicYear: string; from?: string; to?: string }) {
    const { data } = await api.get('/finance/reports/income-statement', { params });
    return data;
  },

  async getFeeCollection(month: string) {
    const { data } = await api.get('/finance/reports/fee-collection', { params: { month } });
    return data;
  },

  async getCollectionReport(params: {
    groupBy: string; from?: string; to?: string; month?: string; grade?: string; academicYear?: string;
  }) {
    const { data } = await api.get('/finance/reports/collection', { params });
    return data;
  },

  async getOutstandingReport(params: { groupBy: string; grade?: string; academicYear?: string }) {
    const { data } = await api.get('/finance/reports/outstanding', { params });
    return data;
  },

  async getOutstandingDetailReport(params: { grade?: string; academicYear?: string }) {
    const { data } = await api.get('/finance/reports/outstanding', { params: { ...params, format: 'detail' } });
    return data;
  },

  async getCollectionDetailReport(params: { from?: string; to?: string; month?: string; grade?: string; academicYear?: string }) {
    const { data } = await api.get('/finance/reports/collection', { params: { ...params, format: 'detail' } });
    return data;
  },

  // ── Discount / Scholarship Programs ───────────────────────────────────────
  async getDiscountPrograms() {
    const { data } = await api.get('/finance/discount-programs');
    return data;
  },
  async createDiscountProgram(payload: any) {
    const { data } = await api.post('/finance/discount-programs', payload);
    return data;
  },
  async updateDiscountProgram(id: string, payload: any) {
    const { data } = await api.put(`/finance/discount-programs/${id}`, payload);
    return data;
  },
  async deleteDiscountProgram(id: string) {
    const { data } = await api.delete(`/finance/discount-programs/${id}`);
    return data;
  },

  // ── Fee Assignments ────────────────────────────────────────────────────────
  async getFeeAssignments() {
    const { data } = await api.get('/finance/fee-assignments');
    return data;
  },
  async createFeeAssignment(payload: any) {
    const { data } = await api.post('/finance/fee-assignments', payload);
    return data;
  },
  async deleteFeeAssignment(id: string) {
    const { data } = await api.delete(`/finance/fee-assignments/${id}`);
    return data;
  },

  // ── Challan / Invoice Generation ───────────────────────────────────────────
  async generateInvoices(payload: { month: string; academicYear?: string; scopeType?: string; scopeValue?: string }) {
    const { data } = await api.post('/finance/invoices/generate', payload);
    return data;
  },
};

export default financeService;
