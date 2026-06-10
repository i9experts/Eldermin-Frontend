import axios from 'axios';

const api = axios.create({
  baseURL: 'http://93.127.163.238:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
