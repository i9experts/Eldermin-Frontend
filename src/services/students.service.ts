import api from '../lib/api';

const studentsService = {
  getDashboard: async () => {
    const { data } = await api.get('/students/dashboard');
    return data;
  },
  getStudents: async (params?: { status?: string; search?: string }) => {
    const { data } = await api.get('/students', { params });
    return data;
  },
  getStudentById: async (id: string) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },
  createStudent: async (payload: any) => {
    const { data } = await api.post('/students', payload);
    return data;
  },
  updateStudent: async (id: string, payload: any) => {
    // Backend only defines @Put(':id'), not @Patch — using patch() here
    // silently 404'd on every save attempt.
    const { data } = await api.put(`/students/${id}`, payload);
    return data;
  },
  deleteStudent: async (id: string) => {
    const { data } = await api.delete(`/students/${id}`);
    return data;
  },
  bulkUpdateStatus: async (payload: { studentIds: string[]; status: string; leftDate?: string; leftReason?: string }) => {
    const { data } = await api.patch('/students/bulk-status', payload);
    return data;
  },
  bulkAssignCampus: async (campusId: string, grade?: string, section?: string) => {
    const { data } = await api.patch('/students/bulk-assign-campus', { campusId, grade, section });
    return data;
  },
  uploadPhoto: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post(`/students/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
  generateProfilePdf: async (id: string, fields: string[], studentName?: string, institutionId?: string) => {
    const response = await api.post(`/students/${id}/profile-pdf`, { fields, institutionId }, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(studentName || 'student-profile').replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  generateStudentListPdf: async (filters: { grades?: string[]; sections?: string[]; statuses?: string[] }) => {
    const response = await api.post('/students/reports/print-list', filters, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-list-report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  generateGrRegisterPdf: async (filters: { grades?: string[]; sections?: string[]; campusId?: string; institutionId?: string }) => {
    const response = await api.post('/students/reports/gr-register', filters, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gr-register.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  getDistinctGradesSections: async () => {
    const { data } = await api.get('/students/filters/grades-sections');
    return data;
  },
  getGuardians: async (studentId?: string) => {
    const { data } = await api.get('/students/guardians/list', {
      params: studentId ? { studentId } : {},
    });
    return data;
  },
  createGuardian: async (payload: any) => {
    const { data } = await api.post('/students/guardians', payload);
    return data;
  },
  markAttendance: async (records: any[]) => {
    const { data } = await api.post('/students/attendance/bulk', { records });
    return data;
  },
  getAttendance: async (params: { studentId?: string; sectionId?: string; date?: string }) => {
    const { data } = await api.get('/students/attendance/list', { params });
    return data;
  },
  getMedicalRecord: async (studentId: string) => {
    const { data } = await api.get(`/students/${studentId}/medical`);
    return data;
  },
  upsertMedicalRecord: async (studentId: string, payload: any) => {
    const { data } = await api.post(`/students/${studentId}/medical`, payload);
    return data;
  },
  getStudentNotes: async (studentId: string) => {
    const { data } = await api.get(`/students/${studentId}/notes`);
    return data;
  },
  createStudentNote: async (studentId: string, payload: any) => {
    const { data } = await api.post(`/students/${studentId}/notes`, payload);
    return data;
  },
  getStudentDocuments: async (studentId: string) => {
    const { data } = await api.get(`/students/${studentId}/documents`);
    return data;
  },
  createStudentDocument: async (studentId: string, payload: any) => {
    const { data } = await api.post(`/students/${studentId}/documents`, payload);
    return data;
  },
  getAcademicHistory: async (studentId: string) => {
    const { data } = await api.get(`/students/${studentId}/academic-history`);
    return data;
  },
  createAcademicHistory: async (studentId: string, payload: any) => {
    const { data } = await api.post(`/students/${studentId}/academic-history`, payload);
    return data;
  },
  getEnrollmentFields: async () => {
    const { data } = await api.get('/students/enrollment-fields');
    return data;
  },
  createEnrollmentField: async (payload: any) => {
    const { data } = await api.post('/students/enrollment-fields', payload);
    return data;
  },
  updateEnrollmentField: async (id: string, payload: any) => {
    const { data } = await api.patch(`/students/enrollment-fields/${id}`, payload);
    return data;
  },
  deleteEnrollmentField: async (id: string) => {
    const { data } = await api.delete(`/students/enrollment-fields/${id}`);
    return data;
  },
  getBulkImportTemplate: async () => {
    const { data } = await api.get('/students/bulk-import/template', { responseType: 'blob' });
    return data;
  },
  previewBulkImport: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/students/bulk-import/preview', form, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  },
  commitBulkImport: async (payload: { rows: any[]; duplicateAction: 'skip' | 'update' | 'createAnyway' }) => {
    // Bulk imports can involve hundreds of rows — the shared client's 15s
    // default timeout is fine for normal requests but far too short here.
    const { data } = await api.post('/students/bulk-import/commit', payload, { timeout: 120000 });
    return data;
  },
};

export default studentsService;
