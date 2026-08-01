import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // The JWT payload never includes academicYear at all (only schoolSlug,
  // role, campusId, etc - see jwt.strategy.ts), so every backend
  // controller's ctx() fallback (req.user.academicYear || headers['x-
  // academic-year'] || '2025-26') depends entirely on this header. This
  // client previously sent neither header, so every request through it
  // (finance.service.ts, students.service.ts, organization.service.ts,
  // families.service.ts, etc) silently used the hardcoded '2025-26'
  // fallback regardless of what the Academic Year switcher showed -
  // while other API clients in this app (pdf.api.ts, finance.api.ts...)
  // DID send the real header, causing data created via one path to be
  // invisible to reads/prints via another. Sending it here too closes
  // that gap for every service built on this shared client.
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eldermin_token');
      localStorage.removeItem('eldermin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
