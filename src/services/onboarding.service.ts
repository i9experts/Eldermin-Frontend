import api from '../lib/api';

const onboardingService = {
  async saveStep(step: number, data: any) {
    const { data: res } = await api.patch('/onboarding/step', { step, data });
    return res;
  },
  async complete() {
    const { data: res } = await api.post('/onboarding/complete');
    return res;
  },
  async getSession() {
    const { data: res } = await api.get('/onboarding/session');
    return res;
  },
};

export default onboardingService;
