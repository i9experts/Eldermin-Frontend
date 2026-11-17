import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import authService from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

interface TourState {
  globalTourCompleted: boolean;
  moduleToursSeen: string[];
}

// Reads tour state straight from GET /auth/me rather than AuthContext's
// `user` object: `user` is populated from the /auth/login response (or
// localStorage) on normal sign-in, which doesn't carry these fields, so a
// dedicated fetch is the only way to reliably know whether this user has
// already seen the tour.
export function useTourState() {
  const { isAuthenticated } = useAuth();
  return useQuery<TourState>({
    queryKey: ['tour-state'],
    queryFn: async () => {
      const data = await authService.getMe();
      return {
        globalTourCompleted: !!data.globalTourCompleted,
        moduleToursSeen: Array.isArray(data.moduleToursSeen) ? data.moduleToursSeen : [],
      };
    },
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
}

export function useMarkTourSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scope: string) => authService.updateTourState(scope),
    onSuccess: (_data, scope) => {
      queryClient.setQueryData<TourState | undefined>(['tour-state'], (prev) => {
        if (!prev) return prev;
        if (scope === 'global') return { ...prev, globalTourCompleted: true };
        return prev.moduleToursSeen.includes(scope)
          ? prev
          : { ...prev, moduleToursSeen: [...prev.moduleToursSeen, scope] };
      });
    },
  });
}
