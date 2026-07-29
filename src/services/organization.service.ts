import api from '../lib/api';

const organizationService = {
  // ── Profile ────────────────────────────────────────────────────────────────
  async getProfile() {
    const { data } = await api.get('/organization/profile');
    return data;
  },

  /** Alias kept for InstitutionsTab backward-compat */
  async getInstitution() {
    return organizationService.getProfile();
  },

  async updateProfile(payload: Record<string, any>) {
    const { data } = await api.put('/organization/profile', payload);
    return data;
  },

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await api.post('/organization/profile/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  /** Alias kept for backward-compat */
  async updateInstitution(payload: Record<string, any>) {
    return organizationService.updateProfile(payload);
  },

  // ── Group Institutions ────────────────────────────────────────────────────
  async getInstitutions() {
    const { data } = await api.get('/organization/institutions');
    return data;
  },

  async createInstitution(payload: Record<string, any>) {
    const { data } = await api.post('/organization/institutions', payload);
    return data;
  },

  async updateInstitutionRecord(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/institutions/${id}`, payload);
    return data;
  },

  async archiveInstitutionRecord(id: string) {
    const { data } = await api.delete(`/organization/institutions/${id}`);
    return data;
  },

  async getOverview() {
    const { data } = await api.get('/organization/overview');
    return data;
  },

  // ── Campuses ───────────────────────────────────────────────────────────────
  async getCampuses() {
    const { data } = await api.get('/organization/campuses');
    return data;
  },

  async createCampus(payload: Record<string, any>) {
    const { data } = await api.post('/organization/campuses', payload);
    return data;
  },

  async updateCampus(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/campuses/${id}`, payload);
    return data;
  },

  async deleteCampus(id: string) {
    const { data } = await api.delete(`/organization/campuses/${id}`);
    return data;
  },

  // ── Academic Years ─────────────────────────────────────────────────────────
  async getAcademicYears() {
    const { data } = await api.get('/organization/academic-years');
    return data;
  },

  async createAcademicYear(payload: Record<string, any>) {
    const { data } = await api.post('/organization/academic-years', payload);
    return data;
  },

  async setCurrentYear(id: string) {
    const { data } = await api.patch(`/organization/academic-years/${id}/set-current`);
    return data;
  },

  // ── Grades ─────────────────────────────────────────────────────────────────
  async getGrades(campusId?: string) {
    const { data } = await api.get('/organization/grades', { params: campusId ? { campusId } : undefined });
    return data;
  },

  async createGrade(payload: Record<string, any>) {
    const { data } = await api.post('/organization/grades', payload);
    return data;
  },

  async seedGrades() {
    const { data } = await api.post('/organization/grades/seed');
    return data;
  },

  async addSection(gradeId: string, section: Record<string, any>) {
    const { data } = await api.post(`/organization/grades/${gradeId}/sections`, section);
    return data;
  },

  // ── Departments ────────────────────────────────────────────────────────────
  async getDepartments() {
    const { data } = await api.get('/organization/departments');
    return data;
  },

  async createDepartment(payload: Record<string, any>) {
    const { data } = await api.post('/organization/departments', payload);
    return data;
  },

  async updateDepartment(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/departments/${id}`, payload);
    return data;
  },

  // ── Designations ───────────────────────────────────────────────────────────
  async getDesignations(category?: string) {
    const { data } = await api.get('/organization/designations', { params: category ? { category } : undefined });
    return data;
  },

  async createDesignation(payload: Record<string, any>) {
    const { data } = await api.post('/organization/designations', payload);
    return data;
  },

  // ── Board Members ──────────────────────────────────────────────────────────
  async getBoardMembers() {
    const { data } = await api.get('/organization/board-members');
    return data;
  },

  async createBoardMember(payload: Record<string, any>) {
    const { data } = await api.post('/organization/board-members', payload);
    return data;
  },

  async updateBoardMember(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/board-members/${id}`, payload);
    return data;
  },

  async deleteBoardMember(id: string) {
    const { data } = await api.delete(`/organization/board-members/${id}`);
    return data;
  },

  // ── Committees ─────────────────────────────────────────────────────────────
  async getCommittees() {
    const { data } = await api.get('/organization/committees');
    return data;
  },

  async createCommittee(payload: Record<string, any>) {
    const { data } = await api.post('/organization/committees', payload);
    return data;
  },

  async updateCommittee(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/committees/${id}`, payload);
    return data;
  },

  async deleteCommittee(id: string) {
    const { data } = await api.delete(`/organization/committees/${id}`);
    return data;
  },

  // ── Meetings ───────────────────────────────────────────────────────────────
  async getMeetings(type?: string) {
    const { data } = await api.get('/organization/meetings', { params: type ? { type } : undefined });
    return data;
  },

  async createMeeting(payload: Record<string, any>) {
    const { data } = await api.post('/organization/meetings', payload);
    return data;
  },

  async updateMeeting(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/meetings/${id}`, payload);
    return data;
  },

  async deleteMeeting(id: string) {
    const { data } = await api.delete(`/organization/meetings/${id}`);
    return data;
  },

  // ── Workflows ──────────────────────────────────────────────────────────────
  async getWorkflows() {
    const { data } = await api.get('/organization/workflows');
    return data;
  },

  async createWorkflow(payload: Record<string, any>) {
    const { data } = await api.post('/organization/workflows', payload);
    return data;
  },

  async updateWorkflow(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/organization/workflows/${id}`, payload);
    return data;
  },

  async deleteWorkflow(id: string) {
    const { data } = await api.delete(`/organization/workflows/${id}`);
    return data;
  },

  // ── Policies (backed by compliance module) ─────────────────────────────────
  async getPolicies() {
    const { data } = await api.get('/compliance/policies');
    return data?.data ?? [];
  },

  async createPolicy(payload: Record<string, any>) {
    const { data } = await api.post('/compliance/policies', payload);
    return data;
  },

  async updatePolicy(id: string, payload: Record<string, any>) {
    const { data } = await api.put(`/compliance/policies/${id}`, payload);
    return data;
  },

  // ── Audit Logs (backed by compliance module) ───────────────────────────────
  async getAuditLogs(params?: Record<string, any>) {
    const { data } = await api.get('/compliance/audit-logs', { params });
    return data?.data ?? [];
  },

  // ── Staff (backed by HR module, used for head-of-department dropdowns) ─────
  async getStaff() {
    const { data } = await api.get('/hr/staff');
    return data ?? [];
  },

  // ── Stubs for tabs with no backend endpoint yet ────────────────────────────
  async getApprovals()                                   { return []; },
  async createApproval(_p: Record<string, any>)         { return null; },
  async updateApproval(_id: string, _p: Record<string, any>) { return null; },
};

export default organizationService;
