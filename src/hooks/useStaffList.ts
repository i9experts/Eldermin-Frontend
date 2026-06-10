import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1` });
api.interceptors.request.use(config => {
  config.headers['x-school-slug'] = localStorage.getItem('schoolSlug') || 'demo-school';
  return config;
});

export const useStaffList = () => useQuery({
  queryKey: ['staff', 'dropdown'],
  queryFn: () => api.get('/hr/staff?limit=200&status=active')
    .then(r => r.data?.data || []),
  staleTime: 5 * 60 * 1000,
});
