import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// GET /hr/staff returns a plain array directly (no {data: [...]} wrapper,
// unlike the paginated /students endpoint) — this was reading r.data.data,
// which is always undefined on a plain array, silently falling back to an
// empty list every single time regardless of how much real staff data
// actually existed.
export const useStaffList = () => useQuery({
  queryKey: ['staff', 'dropdown'],
  queryFn: () => api.get('/hr/staff?limit=200&status=active')
    .then(r => r.data || []),
  staleTime: 5 * 60 * 1000,
});
