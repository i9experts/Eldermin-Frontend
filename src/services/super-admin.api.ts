import axios from 'axios';

const sa = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/super-admin`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

sa.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchBIDashboard = () =>
  sa.get('/dashboard').then(r => r.data);

export const fetchInstitutions = (params?: any) =>
  sa.get('/institutions', { params }).then(r => r.data);

export const activateInstitutionFromLead = (leadId: string, moduleIds?: string[]) =>
  sa.post(`/institutions/activate-from-lead/${leadId}`, moduleIds ? { moduleIds } : {}).then(r => r.data);

export const getModuleRegistry = () =>
  sa.get('/module-registry').then(r => r.data);

export const getLeadRequestedModuleIds = (leadId: string) =>
  sa.get(`/leads/${leadId}/requested-module-ids`).then(r => r.data.moduleIds as string[]);

export const getInstitution = (slug: string) =>
  sa.get(`/institutions/${slug}`).then(r => r.data);

export const createInstitution = (data: any) =>
  sa.post('/institutions', data).then(r => r.data);

export const updateStatus = (slug: string, data: any) =>
  sa.patch(`/institutions/${slug}/status`, data).then(r => r.data);

export const updateSubscription = (slug: string, data: any) =>
  sa.patch(`/institutions/${slug}/subscription`, data).then(r => r.data);

export const impersonate = (slug: string) =>
  sa.post(`/institutions/${slug}/impersonate`).then(r => r.data);

export const getSchoolModules = (slug: string) =>
  sa.get(`/institutions/${slug}/modules`).then(r => r.data);

export const setSchoolModules = (slug: string, moduleIds: string[]) =>
  sa.patch(`/institutions/${slug}/modules`, { moduleIds }).then(r => r.data);

export const resetSchoolModulesToPlan = (slug: string) =>
  sa.post(`/institutions/${slug}/modules/reset-to-plan`).then(r => r.data);

export const recalculateUsage = () =>
  sa.post('/institutions/usage/recalculate').then(r => r.data);

export const getAlerts = () =>
  sa.get('/alerts').then(r => r.data);

export const getAnalytics = () =>
  sa.get('/analytics').then(r => r.data);

export const getAnnouncements = () =>
  sa.get('/announcements').then(r => r.data);

export const createAnnouncement = (data: any) =>
  sa.post('/announcements', data).then(r => r.data);

export const getTickets = (params?: any) =>
  sa.get('/tickets', { params }).then(r => r.data);

export const updateTicket = (id: string, data: any) =>
  sa.put(`/tickets/${id}`, data).then(r => r.data);

export const replyToTicket = (id: string, message: string) =>
  sa.post(`/tickets/${id}/reply`, { message }).then(r => r.data);

// ── Parent Leads (SmartVan parent-app registrations) ──────────────
export const fetchParentLeads = (params?: any) =>
  sa.get('/parent-leads', { params }).then(r => r.data);

export const fetchParentLeadFilterOptions = () =>
  sa.get('/parent-leads/filter-options').then(r => r.data);

export const fetchParentLeadInsights = (params?: any) =>
  sa.get('/parent-leads/insights', { params }).then(r => r.data);
