import api from '../lib/api';

export async function uploadEceEvidence(file: File): Promise<{ url: string; key: string; fileName: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload/single/ece-evidence', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export function downloadLearningJourneyPdf(studentId: string, childName: string) {
  return api.get(`/ece/students/${studentId}/learning-journey-pdf`, { responseType: 'blob' }).then((res) => {
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-journey-${childName.replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

const eceService = {
  // Frameworks
  getFrameworks: async () => (await api.get('/ece/frameworks')).data,
  createFramework: async (payload: Record<string, any>) => (await api.post('/ece/frameworks', payload)).data,
  updateFramework: async (id: string, payload: Record<string, any>) => (await api.patch(`/ece/frameworks/${id}`, payload)).data,

  // Domains
  getDomains: async () => (await api.get('/ece/domains')).data,
  createDomain: async (payload: Record<string, any>) => (await api.post('/ece/domains', payload)).data,
  updateDomain: async (id: string, payload: Record<string, any>) => (await api.patch(`/ece/domains/${id}`, payload)).data,
  seedDefaultDomains: async () => (await api.post('/ece/domains/seed-default')).data,

  // Skills
  getSkills: async (domainId?: string) => (await api.get('/ece/skills', { params: domainId ? { domainId } : undefined })).data,
  createSkill: async (payload: Record<string, any>) => (await api.post('/ece/skills', payload)).data,
  updateSkill: async (id: string, payload: Record<string, any>) => (await api.patch(`/ece/skills/${id}`, payload)).data,

  // Indicators
  getIndicators: async (skillId?: string) => (await api.get('/ece/indicators', { params: skillId ? { skillId } : undefined })).data,
  createIndicator: async (payload: Record<string, any>) => (await api.post('/ece/indicators', payload)).data,

  // Age Bands
  getAgeBands: async () => (await api.get('/ece/age-bands')).data,
  createAgeBand: async (payload: Record<string, any>) => (await api.post('/ece/age-bands', payload)).data,

  // Observations
  getObservations: async (params?: Record<string, any>) => (await api.get('/ece/observations', { params })).data,
  createObservation: async (payload: Record<string, any>) => (await api.post('/ece/observations', payload)).data,
  quickObserve: async (payload: Record<string, any>) => (await api.post('/ece/observations/quick', payload)).data,

  // Development Profile
  getProfile: async (studentId: string) => (await api.get(`/ece/students/${studentId}/profile`)).data,
  updateProfileTags: async (studentId: string, payload: { interests?: string[]; schemas?: string[] }) =>
    (await api.patch(`/ece/students/${studentId}/profile/tags`, payload)).data,

  // Portfolio
  getPortfolio: async (studentId: string) => (await api.get(`/ece/students/${studentId}/portfolio`)).data,
  createPortfolioEntry: async (payload: Record<string, any>) => (await api.post('/ece/portfolio', payload)).data,
  shareEntry: async (id: string, isVisibleToFamily: boolean) => (await api.patch(`/ece/portfolio/${id}/share`, { isVisibleToFamily })).data,
  respondToEntry: async (id: string, text: string, respondedBy: string) =>
    (await api.patch(`/ece/portfolio/${id}/respond`, { text, respondedBy })).data,

  // Learning Experiences
  getExperiences: async (domainId?: string) => (await api.get('/ece/experiences', { params: domainId ? { domainId } : undefined })).data,
  createExperience: async (payload: Record<string, any>) => (await api.post('/ece/experiences', payload)).data,
  updateExperience: async (id: string, payload: Record<string, any>) => (await api.put(`/ece/experiences/${id}`, payload)).data,

  // AI Assistance
  suggestObservationMappings: async (narrative: string) => (await api.post('/ece/ai/suggest-mappings', { narrative })).data,
  checkObservationQuality: async (narrative: string) => (await api.post('/ece/ai/check-quality', { narrative })).data,

  // Montessori
  getMontessoriMaterials: async (area?: string) => (await api.get('/ece/montessori/materials', { params: area ? { area } : undefined })).data,
  createMontessoriMaterial: async (payload: Record<string, any>) => (await api.post('/ece/montessori/materials', payload)).data,
  seedClassicMontessoriMaterials: async () => (await api.post('/ece/montessori/materials/seed-classics')).data,
  getWorkRecords: async (studentId: string) => (await api.get(`/ece/montessori/work-records/${studentId}`)).data,
  upsertWorkRecord: async (payload: Record<string, any>) => (await api.put('/ece/montessori/work-records', payload)).data,

  // Environment / Provision Areas
  getEnvironmentAreas: async () => (await api.get('/ece/environment-areas')).data,
  createEnvironmentArea: async (payload: Record<string, any>) => (await api.post('/ece/environment-areas', payload)).data,
  seedDefaultEnvironmentAreas: async () => (await api.post('/ece/environment-areas/seed-default')).data,
  updateEnvironmentArea: async (id: string, payload: Record<string, any>) => (await api.put(`/ece/environment-areas/${id}`, payload)).data,
  logSafetyCheck: async (id: string, checkedBy: string) => (await api.patch(`/ece/environment-areas/${id}/safety-check`, { checkedBy })).data,
  addEnvironmentObservation: async (id: string, note: string) => (await api.patch(`/ece/environment-areas/${id}/observation`, { note })).data,

  // Framework Mapping
  getFrameworkMappings: async (frameworkId: string) => (await api.get('/ece/framework-mappings', { params: { frameworkId } })).data,
  createFrameworkMapping: async (payload: Record<string, any>) => (await api.post('/ece/framework-mappings', payload)).data,
  updateFrameworkMapping: async (id: string, payload: Record<string, any>) => (await api.put(`/ece/framework-mappings/${id}`, payload)).data,
  deleteFrameworkMapping: async (id: string) => (await api.delete(`/ece/framework-mappings/${id}`)).data,

  // Weekly Provision Plan
  getWeeklyPlan: async (gradeLevel: string, sectionName: string | undefined, weekStartDate: string) =>
    (await api.get('/ece/weekly-plan', { params: { gradeLevel, sectionName, weekStartDate } })).data,
  upsertWeeklyPlan: async (payload: Record<string, any>) => (await api.put('/ece/weekly-plan', payload)).data,

  // Children roster
  getChildren: async () => (await api.get('/ece/children')).data,

  // Dashboard
  getDashboard: async () => (await api.get('/ece/dashboard')).data,

  // Coordinator/Principal Insights
  getCoordinatorInsights: async () => (await api.get('/ece/coordinator/coverage')).data,
};

export default eceService;
