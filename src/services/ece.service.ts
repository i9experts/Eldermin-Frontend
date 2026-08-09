import api from '../lib/api';

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

  // Children roster
  getChildren: async () => (await api.get('/ece/children')).data,

  // Dashboard
  getDashboard: async () => (await api.get('/ece/dashboard')).data,
};

export default eceService;
