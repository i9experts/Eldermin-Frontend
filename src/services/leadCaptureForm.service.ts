import api from '../lib/api';

// Public, unauthenticated endpoints reached via a school's own shareable
// admission-inquiry link (see ShareableLinkModal in pages/admissions). No
// school/academic-year header resolution matters here - the :token path
// param is the only tenant identifier, re-validated server-side on every
// call. Uses the same shared `api` client ESignPublicPage already relies
// on for its own public token flow.

export interface PublicLeadFormSubmission {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gradeInterested: string;
  campusPreference?: string;
  notes?: string;
  website?: string; // honeypot - left empty by real applicants
}

const leadCaptureFormService = {
  getFormInfo: async (token: string) => {
    const { data } = await api.get(`/public/lead-form/${token}`);
    return data;
  },
  submit: async (token: string, payload: PublicLeadFormSubmission) => {
    const { data } = await api.post(`/public/lead-form/${token}`, payload);
    return data;
  },
};

export default leadCaptureFormService;
