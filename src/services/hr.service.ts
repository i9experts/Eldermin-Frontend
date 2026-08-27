import api from '../lib/api';

const hrService = {
  // ── Staff ──────────────────────────────────────────────────────────────
  getStaff: async (arg?: any) => {
    // Deliberately destructures rather than forwarding `arg` wholesale -
    // 18 existing call sites pass this function directly as queryFn
    // (unwrapped), meaning React Query calls it with its own internal
    // context object (queryKey/signal/meta, not {campusId, department}).
    // Extracting only the two real fields means those calls correctly
    // get no filter (their actual pre-existing behavior) instead of an
    // AbortSignal object getting serialized into the request's query string.
    const params = { campusId: (arg as any)?.campusId, department: (arg as any)?.department };
    const { data } = await api.get('/hr/staff', { params });
    return data;
  },
  createStaff: async (payload: Record<string, any>) => { const { data } = await api.post('/hr/staff', payload); return data; },
  createLoginForStaff: async (staffId: string) => { const { data } = await api.post(`/hr/staff/${staffId}/create-login`); return data; },
  bulkCreateLogins: async (staffIds?: string[]) => { const { data } = await api.post('/hr/staff/bulk-create-logins', { staffIds }, { timeout: 60000 }); return data; },
  getStaffById: async (id: string) => { const { data } = await api.get(`/hr/staff/${id}`); return data; },
  updateStaff: async (id: string, payload: Record<string, any>) => { const { data } = await api.patch(`/hr/staff/${id}`, payload); return data; },
  uploadStaffPhoto: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post(`/hr/staff/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
  uploadStaffDocument: async (id: string, file: File, label: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    const { data } = await api.post(`/hr/staff/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  // ── Designations ───────────────────────────────────────────────────────
  getDesignations: async () => { const { data } = await api.get('/hr/designations'); return data; },
  createDesignation: async (payload: Record<string, any>) => { const { data } = await api.post('/hr/designations', payload); return data; },

  // ── Legacy leave endpoints (kept for backward compat) ──────────────────
  submitLeave: async (payload: Record<string, any>) => { const { data } = await api.post('/hr/leave/applications', payload); return data; },
  getStaffLeave: async (id: string) => { const { data } = await api.get(`/hr/staff/${id}/leave`); return data; },
  getStaffPayslips: async (id: string) => { const { data } = await api.get(`/hr/staff/${id}/payslips`); return data; },

  getSalaryComponents: async () => { const { data } = await api.get('/hr/salary-components'); return data; },
  createSalaryComponent: async (payload: Record<string, any>) => { const { data } = await api.post('/hr/salary-components', payload); return data; },
  updateSalaryComponent: async (id: string, payload: Record<string, any>) => { const { data } = await api.patch(`/hr/salary-components/${id}`, payload); return data; },
  deleteSalaryComponent: async (id: string) => { const { data } = await api.delete(`/hr/salary-components/${id}`); return data; },
  getSalaryTemplates: async () => { const { data } = await api.get('/hr/salary-templates'); return data; },
  createSalaryTemplate: async (payload: Record<string, any>) => { const { data } = await api.post('/hr/salary-templates', payload); return data; },
  updateSalaryTemplate: async (id: string, payload: Record<string, any>) => { const { data } = await api.patch(`/hr/salary-templates/${id}`, payload); return data; },
  deleteSalaryTemplate: async (id: string) => { const { data } = await api.delete(`/hr/salary-templates/${id}`); return data; },
  setStaffSalaryStructure: async (staffId: string, lines: { componentId: string; amount: number }[]) => {
    const { data } = await api.patch(`/hr/staff/${staffId}/salary-structure`, { lines });
    return data;
  },

  downloadPayslipPdf: async (payslipId: string, filename: string) => {
    const { data } = await api.get(`/hr/payslips/${payslipId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
  getStaffDocuments: async (id: string) => { const { data } = await api.get(`/hr/staff/${id}/documents`); return data; },
  getStaffNotes: async (id: string) => { const { data } = await api.get(`/hr/staff/${id}/notes`); return data; },
  createStaffNote: async (id: string, payload: Record<string, any>) => { const { data } = await api.post(`/hr/staff/${id}/notes`, payload); return data; },

  // ── Lifecycle ──────────────────────────────────────────────────────────
  getLifecycle: async () => { const { data } = await api.get('/hr/lifecycle'); return data; },
  getLifecycleStats: async () => { const { data } = await api.get('/hr/lifecycle/stats'); return data; },
  getLifecycleById: async (id: string) => { const { data } = await api.get(`/hr/lifecycle/${id}`); return data; },
  createCandidate: async (payload: any) => { const { data } = await api.post('/hr/lifecycle', payload); return data; },
  updateCandidate: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/lifecycle/${id}`, payload); return data; },
  moveToStage: async (id: string, stage: string, note: string) => { const { data } = await api.patch(`/hr/lifecycle/${id}/stage`, { stage, note }); return data; },
  scheduleInterview: async (id: string, payload: any) => { const { data } = await api.post(`/hr/lifecycle/${id}/interview`, payload); return data; },
  updateInterviewFeedback: async (id: string, round: number, payload: any) => { const { data } = await api.patch(`/hr/lifecycle/${id}/interview/${round}/feedback`, payload); return data; },
  makeOffer: async (id: string, payload: any) => { const { data } = await api.post(`/hr/lifecycle/${id}/offer`, payload); return data; },
  respondToOffer: async (id: string, response: string, note: string) => { const { data } = await api.patch(`/hr/lifecycle/${id}/offer/respond`, { response, note }); return data; },
  updateOnboardingTask: async (id: string, taskIndex: number, isDone: boolean) => { const { data } = await api.patch(`/hr/lifecycle/${id}/onboarding/${taskIndex}`, { isDone }); return data; },
  getOnboardingEmployees: async () => { const { data } = await api.get('/hr/lifecycle', { params: {} }); return data?.grouped?.onboarding || []; },
  completeOnboarding: async (lifecycleId: string) => { const { data } = await api.patch(`/hr/lifecycle/${lifecycleId}/stage`, { stage: 'active', note: 'Onboarding completed — converted to active employee' }); return data; },

  // ── Recruitment ────────────────────────────────────────────────────────
  getRecruitmentStats: async () => { const { data } = await api.get('/hr/recruitment/stats'); return data; },
  getJobs: async (params?: any) => { const { data } = await api.get('/hr/recruitment/jobs', { params }); return data; },
  createJob: async (payload: any) => { const { data } = await api.post('/hr/recruitment/jobs', payload); return data; },
  getJobById: async (id: string) => { const { data } = await api.get(`/hr/recruitment/jobs/${id}`); return data; },
  updateJob: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/recruitment/jobs/${id}`, payload); return data; },
  getApplications: async (params?: any) => { const { data } = await api.get('/hr/recruitment/applications', { params }); return data; },
  createApplication: async (payload: any) => { const { data } = await api.post('/hr/recruitment/applications', payload); return data; },
  updateAppStage: async (id: string, stage: string, note: string) => { const { data } = await api.patch(`/hr/recruitment/applications/${id}/stage`, { stage, note }); return data; },
  getInterviews: async (params?: any) => { const { data } = await api.get('/hr/recruitment/interviews', { params }); return data; },
  scheduleRecruitmentInterview: async (payload: any) => { const { data } = await api.post('/hr/recruitment/interviews', payload); return data; },
  submitInterviewFeedback: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/recruitment/interviews/${id}/feedback`, payload); return data; },

  // ── ATTENDANCE ─────────────────────────────────────────────────────────
  getStaffAttendance: async (params?: any) => { const { data } = await api.get('/hr/attendance', { params }); return data; },
  markStaffAttendance: async (records: any[]) => { const { data } = await api.post('/hr/attendance/bulk', { records }); return data; },
  deleteStaffAttendance: async (date: string, staffIds: string[]) => { const { data } = await api.delete('/hr/attendance', { data: { date, staffIds } }); return data; },
  getAttendanceSummary: async (month: number, year: number) => { const { data } = await api.get('/hr/attendance/summary', { params: { month, year } }); return data; },

  // ── BIOMETRIC INTEGRATION ──────────────────────────────────────────────
  getBiometricStatus: async () => { const { data } = await api.get('/hr/attendance/biometric/status'); return data; },
  saveBiometricConfig: async (payload: { deviceIp: string; devicePort?: number; deviceType?: string; autoSyncEnabled?: boolean; autoSyncIntervalMins?: number }) => { const { data } = await api.post('/hr/attendance/biometric/config', payload); return data; },
  syncBiometricAttendance: async () => { const { data } = await api.post('/hr/attendance/biometric/sync', {}); return data; },
  importAttendanceCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/hr/attendance/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  // ── LEAVE ──────────────────────────────────────────────────────────────
  getLeaveApplications: async (params?: any) => { const { data } = await api.get('/hr/leave', { params }); return data; },
  createLeaveApplication: async (payload: any) => { const { data } = await api.post('/hr/leave', payload); return data; },
  updateLeaveStatus: async (id: string, status: string, note: string) => { const { data } = await api.patch(`/hr/leave/${id}/status`, { status, note }); return data; },
  getLeaveStats: async () => { const { data } = await api.get('/hr/leave/stats'); return data; },
  getLeaveBalance: async (staffId: string) => { const { data } = await api.get(`/hr/leave/balance/${staffId}`); return data; },
  getAllLeaveBalances: async () => { const { data } = await api.get('/hr/leave/balances'); return data; },
  allocateLeaveBalances: async (policyId: string, academicYear?: string) => { const { data } = await api.post('/hr/leave/balances/allocate', { policyId, academicYear }); return data; },

  // ── LEAVE POLICIES ─────────────────────────────────────────────────────
  getLeavePolicies: async () => { const { data } = await api.get('/hr/leave/policies'); return data; },
  createLeavePolicy: async (payload: any) => { const { data } = await api.post('/hr/leave/policies', payload); return data; },
  updateLeavePolicy: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/leave/policies/${id}`, payload); return data; },
  assignLeavePolicy: async (policyId: string, staffId: string, academicYearId: string) => { const { data } = await api.post(`/hr/leave/policies/${policyId}/assign`, { staffId, academicYearId }); return data; },
  bulkAssignLeavePolicy: async (policyId: string, academicYearId: string) => { const { data } = await api.post(`/hr/leave/policies/${policyId}/bulk-assign`, { academicYearId }); return data; },
  seedLeavePolicies: async () => { const { data } = await api.post('/hr/leave/policies/seed-defaults', {}); return data; },

  // ── PAYROLL ────────────────────────────────────────────────────────────
  getPayrollStats: async () => { const { data } = await api.get('/hr/payroll/stats'); return data; },
  getPayrollRuns: async () => { const { data } = await api.get('/hr/payroll/runs'); return data; },
  createPayrollRun: async (payload: any) => { const { data } = await api.post('/hr/payroll/runs', payload); return data; },
  updatePayrollStatus: async (id: string, status: string, payment?: { paymentMethod?: string; bankAccountId?: string; referenceNumber?: string; paymentDate?: string }) => {
    const { data } = await api.patch(`/hr/payroll/runs/${id}/status`, { status, ...payment }); return data;
  },
  processPayrollBatch: async (runId: string, rows: any[]) => { const { data } = await api.post(`/hr/payroll/runs/${runId}/process-batch`, { rows }); return data; },
  deletePayrollRun: async (id: string) => { const { data } = await api.delete(`/hr/payroll/runs/${id}`); return data; },
  getPayrollPayments: async (payrollRunId?: string) => { const { data } = await api.get('/hr/payroll/payments', { params: payrollRunId ? { payrollRunId } : undefined }); return data; },

  // ── PAYSLIPS ───────────────────────────────────────────────────────────
  getPayslips: async (params?: any) => { const { data } = await api.get('/hr/payslips', { params }); return data; },
  createPayslip: async (payload: any) => { const { data } = await api.post('/hr/payslips', payload); return data; },

  // ── PERFORMANCE ────────────────────────────────────────────────────────
  getPerformanceReviews: async (params?: any) => { const { data } = await api.get('/hr/performance', { params }); return data; },
  createPerformanceReview: async (payload: any) => { const { data } = await api.post('/hr/performance', payload); return data; },
  updatePerformanceReview: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/performance/${id}`, payload); return data; },

  // ── TRAINING ───────────────────────────────────────────────────────────
  getTrainings: async () => { const { data } = await api.get('/hr/training'); return data; },
  createTraining: async (payload: any) => { const { data } = await api.post('/hr/training', payload); return data; },
  updateTraining: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/training/${id}`, payload); return data; },
  enrollInTraining: async (id: string, staffId: string, staffName: string) => { const { data } = await api.post(`/hr/training/${id}/enroll`, { staffId, staffName }); return data; },

  // ── CONTRACT WORDING TEMPLATES ───────────────────────────────────────
  getContractTemplates: async () => { const { data } = await api.get('/hr/contract-templates'); return data; },
  createContractTemplate: async (payload: any) => { const { data } = await api.post('/hr/contract-templates', payload); return data; },
  updateContractTemplate: async (id: string, payload: any) => { const { data } = await api.put(`/hr/contract-templates/${id}`, payload); return data; },
  deleteContractTemplate: async (id: string) => { const { data } = await api.delete(`/hr/contract-templates/${id}`); return data; },

  // ── CONTRACTS ──────────────────────────────────────────────────────────
  getContractStats: async () => { const { data } = await api.get('/hr/contracts/stats'); return data; },
  getContracts: async (params?: any) => { const { data } = await api.get('/hr/contracts', { params }); return data; },
  createContract: async (payload: any) => { const { data } = await api.post('/hr/contracts', payload); return data; },
  updateContract: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/contracts/${id}`, payload); return data; },
  downloadContractPdf: async (id: string, filename: string) => {
    const { data } = await api.get(`/hr/contracts/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  },

  // ── OFFER LETTER WORDING TEMPLATES ────────────────────────────────────
  getOfferLetterTemplates: async () => { const { data } = await api.get('/hr/offer-letter-templates'); return data; },
  createOfferLetterTemplate: async (payload: any) => { const { data } = await api.post('/hr/offer-letter-templates', payload); return data; },
  updateOfferLetterTemplate: async (id: string, payload: any) => { const { data } = await api.put(`/hr/offer-letter-templates/${id}`, payload); return data; },
  deleteOfferLetterTemplate: async (id: string) => { const { data } = await api.delete(`/hr/offer-letter-templates/${id}`); return data; },

  getOfferLetters: async (params?: any) => { const { data } = await api.get('/hr/offer-letters', { params }); return data; },
  createOfferLetter: async (payload: any) => { const { data } = await api.post('/hr/offer-letters', payload); return data; },
  updateOfferLetterStatus: async (id: string, status: string, declineReason?: string) => { const { data } = await api.patch(`/hr/offer-letters/${id}/status`, { status, declineReason }); return data; },
  downloadOfferLetterPdf: async (id: string, filename: string) => {
    const { data } = await api.get(`/hr/offer-letters/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  },

  getAppointmentLetters: async (params?: any) => { const { data } = await api.get('/hr/appointment-letters', { params }); return data; },
  createAppointmentLetter: async (payload: any) => { const { data } = await api.post('/hr/appointment-letters', payload); return data; },
  updateAppointmentLetterStatus: async (id: string, status: string) => { const { data } = await api.patch(`/hr/appointment-letters/${id}/status`, { status }); return data; },
  downloadAppointmentLetterPdf: async (id: string, filename: string) => {
    const { data } = await api.get(`/hr/appointment-letters/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  },

  // ── EXIT ───────────────────────────────────────────────────────────────
  getExitRecords: async () => { const { data } = await api.get('/hr/exit'); return data; },
  createExitRecord: async (payload: any) => { const { data } = await api.post('/hr/exit', payload); return data; },
  updateExitRecord: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/exit/${id}`, payload); return data; },
  updateClearanceItem: async (id: string, index: number, isDone: boolean, clearedBy: string) => { const { data } = await api.patch(`/hr/exit/${id}/clearance/${index}`, { isDone, clearedBy }); return data; },

  // ── EXIT SETTINGS ──────────────────────────────────────────────────────
  getExitSettings: async () => { const { data } = await api.get('/hr/exit-settings'); return data; },
  updateExitSettings: async (payload: any) => { const { data } = await api.patch('/hr/exit-settings', payload); return data; },

  // ── HIRING SETTINGS ────────────────────────────────────────────────────
  getHiringSettings: async () => { const { data } = await api.get('/hr/hiring-settings'); return data; },
  updateHiringSettings: async (payload: any) => { const { data } = await api.patch('/hr/hiring-settings', payload); return data; },

  // ── ATTENDANCE SETTINGS ────────────────────────────────────────────────
  getAttendanceSettings: async () => { const { data } = await api.get('/hr/attendance-settings'); return data; },
  updateAttendanceSettings: async (payload: any) => { const { data } = await api.patch('/hr/attendance-settings', payload); return data; },

  // ── SHIFTS ─────────────────────────────────────────────────────────────
  getShifts: async () => { const { data } = await api.get('/hr/shifts'); return data; },
  createShift: async (payload: any) => { const { data } = await api.post('/hr/shifts', payload); return data; },
  updateShift: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/shifts/${id}`, payload); return data; },
  deleteShift: async (id: string) => { const { data } = await api.delete(`/hr/shifts/${id}`); return data; },
  assignStaffShift: async (staffId: string, shiftId: string | null) => { const { data } = await api.patch(`/hr/staff/${staffId}/shift`, { shiftId }); return data; },
  assignStaffShifts: async (staffId: string, shiftIds: string[]) => { const { data } = await api.patch(`/hr/staff/${staffId}/shifts`, { shiftIds }); return data; },

  // ── REMINDERS (holidays + upcoming) ───────────────────────────────────
  getHolidays: async () => { const { data } = await api.get('/hr/holidays'); return data; },
  createHoliday: async (payload: any) => { const { data } = await api.post('/hr/holidays', payload); return data; },
  updateHoliday: async (id: string, payload: any) => { const { data } = await api.patch(`/hr/holidays/${id}`, payload); return data; },
  deleteHoliday: async (id: string) => { const { data } = await api.delete(`/hr/holidays/${id}`); return data; },
  getUpcomingReminders: async (days?: number) => { const { data } = await api.get('/hr/reminders/upcoming', { params: days ? { days } : {} }); return data; },

  // ── GRIEVANCE ────────────────────────────────────────────────────────────
  getGrievances: async (params?: any) => { const { data } = await api.get('/hr/grievances', { params }); return data; },
  getGrievanceById: async (id: string) => { const { data } = await api.get(`/hr/grievances/${id}`); return data; },
  createGrievance: async (payload: any) => { const { data } = await api.post('/hr/grievances', payload); return data; },
  updateGrievanceStatus: async (id: string, status: string, note: string, byName: string) => { const { data } = await api.patch(`/hr/grievances/${id}/status`, { status, note, byName }); return data; },
  assignGrievance: async (id: string, assignedToStaffId: string, assignedToName: string) => { const { data } = await api.patch(`/hr/grievances/${id}/assign`, { assignedToStaffId, assignedToName }); return data; },

  // ── DAILY WORK SUMMARY ─────────────────────────────────────────────────
  getDailyWorkSummaries: async (params?: any) => { const { data } = await api.get('/hr/daily-summaries', { params }); return data; },
  upsertDailyWorkSummary: async (payload: any) => { const { data } = await api.post('/hr/daily-summaries', payload); return data; },
  acknowledgeDailyWorkSummary: async (id: string, byName: string) => { const { data } = await api.patch(`/hr/daily-summaries/${id}/acknowledge`, { byName }); return data; },
  getDailyWorkSummaryRollup: async (date?: string) => { const { data } = await api.get('/hr/daily-summaries/rollup', { params: date ? { date } : {} }); return data; },

  // ── EXPENSE CLAIMS ─────────────────────────────────────────────────────
  getExpenseClaims: async (params?: any) => { const { data } = await api.get('/hr/expense-claims', { params }); return data; },
  createExpenseClaim: async (payload: any) => { const { data } = await api.post('/hr/expense-claims', payload); return data; },
  updateExpenseClaimStatus: async (id: string, status: string, approvedBy?: string, rejectionReason?: string) => { const { data } = await api.patch(`/hr/expense-claims/${id}/status`, { status, approvedBy, rejectionReason }); return data; },
  addExpenseClaimReceipt: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/hr/expense-claims/${id}/receipts`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  // ── ADVANCES ───────────────────────────────────────────────────────────
  getAdvances: async (params?: any) => { const { data } = await api.get('/hr/advances', { params }); return data; },
  createAdvance: async (payload: any) => { const { data } = await api.post('/hr/advances', payload); return data; },
  updateAdvanceStatus: async (id: string, status: string, approvedBy?: string) => { const { data } = await api.patch(`/hr/advances/${id}/status`, { status, approvedBy }); return data; },
};

export default hrService;
