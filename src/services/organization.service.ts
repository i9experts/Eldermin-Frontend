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

  /** Alias kept for backward-compat */
  async updateInstitution(payload: Record<string, any>) {
    return organizationService.updateProfile(payload);
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

  // ── Stubs for tabs with no backend endpoint yet ────────────────────────────
  async getCommittees()                                  { return []; },
  async createCommittee(_p: Record<string, any>)        { return null; },
  async updateCommittee(_id: string, _p: Record<string, any>) { return null; },
  async deleteCommittee(_id: string)                    { return null; },

  async getBoardMembers()                                { return []; },
  async createBoardMember(_p: Record<string, any>)      { return null; },
  async updateBoardMember(_id: string, _p: Record<string, any>) { return null; },
  async deleteBoardMember(_id: string)                  { return null; },

  async getPolicies()                                    { return []; },
  async createPolicy(_p: Record<string, any>)           { return null; },
  async updatePolicy(_id: string, _p: Record<string, any>) { return null; },

  async getMeetings()                                    { return []; },
  async createMeeting(_p: Record<string, any>)          { return null; },
  async updateMeeting(_id: string, _p: Record<string, any>) { return null; },

  async getApprovals()                                   { return []; },
  async createApproval(_p: Record<string, any>)         { return null; },
  async updateApproval(_id: string, _p: Record<string, any>) { return null; },

  async getWorkflows()                                   { return []; },
};

export default organizationService;
