import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/campus.api';

// ── Dashboard ────────────────────────────────────────────────
export const useCampusDashboard = () =>
  useQuery({ queryKey: ['campus', 'dashboard'], queryFn: api.fetchDashboard, staleTime: 30000 });

// ── Buildings ────────────────────────────────────────────────
export const useBuildings = (params?: any) =>
  useQuery({ queryKey: ['campus', 'buildings', params], queryFn: () => api.fetchBuildings(params), staleTime: 30000 });

export const useCreateBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBuilding,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'buildings'] }),
  });
};

export const useUpdateBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateBuilding(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'buildings'] }),
  });
};

export const useDeleteBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteBuilding(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'buildings'] }),
  });
};

// ── Campus Rooms ─────────────────────────────────────────────
export const useCampusRooms = (params?: any) =>
  useQuery({ queryKey: ['campus', 'rooms', params], queryFn: () => api.fetchCampusRooms(params), staleTime: 30000 });

export const useCreateCampusRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCampusRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'rooms'] }),
  });
};

export const useUpdateCampusRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCampusRoom(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'rooms'] }),
  });
};

export const useDeleteCampusRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCampusRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'rooms'] }),
  });
};

// ── Transport ─────────────────────────────────────────────────
export const useVehicles = (params?: any) =>
  useQuery({ queryKey: ['campus', 'vehicles', params], queryFn: () => api.fetchVehicles(params), staleTime: 30000 });

export const useCreateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'vehicles'] }),
  });
};

export const useUpdateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateVehicle(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'vehicles'] }),
  });
};

export const useRoutes = (params?: any) =>
  useQuery({ queryKey: ['campus', 'routes', params], queryFn: () => api.fetchRoutes(params), staleTime: 30000 });

export const useCreateRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRoute,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'routes'] }),
  });
};

export const useRouteStudents = (routeId: string) =>
  useQuery({
    queryKey: ['campus', 'route-students', routeId],
    queryFn: () => api.getRouteStudents(routeId),
    enabled: !!routeId,
  });

export const useAllocateTransport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.allocateTransport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'routes'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};

// ── Hostel ────────────────────────────────────────────────────
export const useHostelBlocks = (params?: any) =>
  useQuery({ queryKey: ['campus', 'hostel-blocks', params], queryFn: () => api.fetchBlocks(params), staleTime: 60000 });

export const useCreateHostelBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'hostel-blocks'] }),
  });
};

export const useHostelRooms = (params?: any) =>
  useQuery({ queryKey: ['campus', 'hostel-rooms', params], queryFn: () => api.fetchRooms(params), staleTime: 30000 });

export const useCreateHostelRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'hostel-rooms'] }),
  });
};

export const useHostelAllocations = (params?: any) =>
  useQuery({ queryKey: ['campus', 'hostel-allocs', params], queryFn: () => api.fetchAllocations(params), staleTime: 30000 });

export const useAllocateHostel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.allocateHostel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'hostel-allocs'] });
      qc.invalidateQueries({ queryKey: ['campus', 'hostel-rooms'] });
      qc.invalidateQueries({ queryKey: ['campus', 'hostel-blocks'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};

export const useCheckOutHostel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.checkOutHostel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'hostel-allocs'] });
      qc.invalidateQueries({ queryKey: ['campus', 'hostel-rooms'] });
      qc.invalidateQueries({ queryKey: ['campus', 'hostel-blocks'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};

// ── Maintenance ───────────────────────────────────────────────
export const useMaintenance = (params?: any) =>
  useQuery({ queryKey: ['campus', 'maintenance', params], queryFn: () => api.fetchMaintenance(params), staleTime: 20000 });

export const useMaintenanceStats = () =>
  useQuery({ queryKey: ['campus', 'maintenance-stats'], queryFn: api.fetchMaintenanceStats, staleTime: 60000 });

export const useCreateMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createMaintenance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'maintenance'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};

export const useUpdateMaintenanceStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMaintenanceStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'maintenance'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};

// ── Assets ────────────────────────────────────────────────────
export const useCampusAssets = (params?: any) =>
  useQuery({ queryKey: ['campus', 'assets', params], queryFn: () => api.fetchAssets(params), staleTime: 60000 });

export const useCampusAssetSummary = () =>
  useQuery({ queryKey: ['campus', 'asset-summary'], queryFn: api.getAssetSummary, staleTime: 60000 });

export const useCreateCampusAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'assets'] });
      qc.invalidateQueries({ queryKey: ['campus', 'asset-summary'] });
    },
  });
};

export const useUpdateCampusAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAsset(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campus', 'assets'] }),
  });
};

export const useDisposeCampusAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.disposeAsset(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'assets'] });
      qc.invalidateQueries({ queryKey: ['campus', 'asset-summary'] });
    },
  });
};

// ── Events ────────────────────────────────────────────────────
export const useEvents = (params?: any) =>
  useQuery({ queryKey: ['campus', 'events', params], queryFn: () => api.fetchEvents(params), staleTime: 30000 });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'events'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};

export const useUpdateEventStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, attendance }: { id: string; status: string; attendance?: number }) =>
      api.updateEventStatus(id, status, attendance),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'events'] });
      qc.invalidateQueries({ queryKey: ['campus', 'dashboard'] });
    },
  });
};
