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
    const { data } = await api.post('/finance/invoices/generate', payload, { timeout: 60000 });
    return data;
  },

  async bulkDeleteInvoices(payload: { month: string; academicYear?: string; scopeType?: string; scopeValue?: string; reason?: string }) {
    const { data } = await api.post('/finance/invoices/bulk-delete', payload, { timeout: 60000 });
    return data;
  },

  async retagInvoiceYear(payload: { month: string; toAcademicYear?: string; scopeType?: string; scopeValue?: string }) {
    const { data } = await api.post('/finance/invoices/retag-year', payload, { timeout: 60000 });
    return data;
  },

  // ── Fiscal Years ────────────────────────────────────────────────────────────
  async getFiscalYears() { const { data } = await api.get('/finance/fiscal-years'); return data; },
  async createFiscalYear(payload: any) { const { data } = await api.post('/finance/fiscal-years', payload); return data; },
  async closeFiscalYear(id: string) { const { data } = await api.patch(`/finance/fiscal-years/${id}/close`); return data; },

  // ── Accounting Periods ──────────────────────────────────────────────────────
  async getAccountingPeriods(fiscalYearId?: string) { const { data } = await api.get('/finance/accounting-periods', { params: fiscalYearId ? { fiscalYearId } : {} }); return data; },
  async setPeriodStatus(id: string, status: string) { const { data } = await api.patch(`/finance/accounting-periods/${id}/status`, { status }); return data; },

  // ── Cost Centers ────────────────────────────────────────────────────────────
  async getCostCenters() { const { data } = await api.get('/finance/cost-centers'); return data; },
  async createCostCenter(payload: any) { const { data } = await api.post('/finance/cost-centers', payload); return data; },
  async updateCostCenter(id: string, payload: any) { const { data } = await api.patch(`/finance/cost-centers/${id}`, payload); return data; },
  async seedCostCenters() { const { data } = await api.post('/finance/cost-centers/seed'); return data; },

  // ── Payment Terms ───────────────────────────────────────────────────────────
  async getPaymentTerms() { const { data } = await api.get('/finance/payment-terms'); return data; },
  async createPaymentTerm(payload: any) { const { data } = await api.post('/finance/payment-terms', payload); return data; },
  async seedPaymentTerms() { const { data } = await api.post('/finance/payment-terms/seed'); return data; },

  // ── Journal Entries ─────────────────────────────────────────────────────────
  async getJournalEntries(params?: any) { const { data } = await api.get('/finance/journal-entries', { params }); return data; },
  async postJournalEntry(payload: any) { const { data } = await api.post('/finance/journal-entries', payload); return data; },

  // ── Ledger Reports ──────────────────────────────────────────────────────────
  async getTrialBalance(asOf?: string) { const { data } = await api.get('/finance/reports/trial-balance', { params: asOf ? { asOf } : {} }); return data; },
  async getGeneralLedger(accountCode: string, from?: string, to?: string) { const { data } = await api.get('/finance/reports/general-ledger', { params: { accountCode, from, to } }); return data; },
  async getPartnerLedger(partnerType: string, partnerId?: string, partnerName?: string) { const { data } = await api.get('/finance/reports/partner-ledger', { params: { partnerType, partnerId, partnerName } }); return data; },
  async getCostCenterReport(from?: string, to?: string) { const { data } = await api.get('/finance/reports/cost-center', { params: { from, to } }); return data; },

  // ── Vendors (Phase 2 — Accounts Payable) ────────────────────────────────────
  async getVendors() { const { data } = await api.get('/finance/vendors'); return data; },
  async createVendor(payload: any) { const { data } = await api.post('/finance/vendors', payload); return data; },
  async updateVendor(id: string, payload: any) { const { data } = await api.patch(`/finance/vendors/${id}`, payload); return data; },

  // ── Vendor Bills ─────────────────────────────────────────────────────────────
  async getVendorBills(params?: any) { const { data } = await api.get('/finance/vendor-bills', { params }); return data; },
  async createVendorBill(payload: any) { const { data } = await api.post('/finance/vendor-bills', payload); return data; },
  async recordVendorPayment(billId: string, payload: any) { const { data } = await api.post(`/finance/vendor-bills/${billId}/payments`, payload); return data; },
  async getVendorPayments(vendorId?: string) { const { data } = await api.get('/finance/vendor-payments', { params: vendorId ? { vendorId } : {} }); return data; },

  // ── AR/AP Aging, Credit Balance, Payment Period Reports ─────────────────────
  async getArAging(asOf?: string) { const { data } = await api.get('/finance/reports/ar-aging', { params: asOf ? { asOf } : {} }); return data; },
  async getApAging(asOf?: string) { const { data } = await api.get('/finance/reports/ap-aging', { params: asOf ? { asOf } : {} }); return data; },
  async getCustomerCreditBalance() { const { data } = await api.get('/finance/reports/customer-credit-balance'); return data; },
  async getPaymentPeriodReport(from?: string, to?: string) { const { data } = await api.get('/finance/reports/payment-period', { params: { from, to } }); return data; },

  // ── Tax Templates (Phase 3) ─────────────────────────────────────────────────
  async getTaxTemplates(type?: string) { const { data } = await api.get('/finance/tax-templates', { params: type ? { type } : {} }); return data; },
  async createTaxTemplate(payload: any) { const { data } = await api.post('/finance/tax-templates', payload); return data; },
  async updateTaxTemplate(id: string, payload: any) { const { data } = await api.patch(`/finance/tax-templates/${id}`, payload); return data; },

  // ── Item Tax Templates ──────────────────────────────────────────────────────
  async getItemTaxTemplates(direction?: string) { const { data } = await api.get('/finance/item-tax-templates', { params: direction ? { direction } : {} }); return data; },
  async createItemTaxTemplate(payload: any) { const { data } = await api.post('/finance/item-tax-templates', payload); return data; },
  async updateItemTaxTemplate(id: string, payload: any) { const { data } = await api.patch(`/finance/item-tax-templates/${id}`, payload); return data; },

  // ── Tax Rules ────────────────────────────────────────────────────────────────
  async getTaxRules() { const { data } = await api.get('/finance/tax-rules'); return data; },
  async createTaxRule(payload: any) { const { data } = await api.post('/finance/tax-rules', payload); return data; },
  async updateTaxRule(id: string, payload: any) { const { data } = await api.patch(`/finance/tax-rules/${id}`, payload); return data; },

  // ── Withholding Tax Categories ───────────────────────────────────────────────
  async getWithholdingCategories() { const { data } = await api.get('/finance/withholding-categories'); return data; },
  async createWithholdingCategory(payload: any) { const { data } = await api.post('/finance/withholding-categories', payload); return data; },
  async updateWithholdingCategory(id: string, payload: any) { const { data } = await api.patch(`/finance/withholding-categories/${id}`, payload); return data; },

  // ── Tax Summary Report ──────────────────────────────────────────────────────
  async getTaxSummaryReport(from?: string, to?: string) { const { data } = await api.get('/finance/reports/tax-summary', { params: { from, to } }); return data; },
};

export default financeService;
