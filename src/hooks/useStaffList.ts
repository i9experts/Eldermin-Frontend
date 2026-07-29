import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useStaffList = () => useQuery({
  queryKey: ['staff', 'dropdown'],
  queryFn: () => api.get('/hr/staff?limit=200&status=active')
    .then(r => r.data?.data || []),
  staleTime: 5 * 60 * 1000,
});
