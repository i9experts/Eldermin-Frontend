import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/campus`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // schoolSlug here is harmless (backend prioritizes the real JWT value),
  // but academicYear was a genuine live bug - the JWT never carries this
  // field, so the backend fell through entirely to this hardcoded '2025-26'
  // header for every request through this client, permanently, regardless
  // of the real current academic year.
  const inst = JSON.parse(localStorage.getItem('eldermin_institution') || 'null');
  config.headers['x-school-slug'] = inst?.slug || 'demo-school';
  config.headers['x-academic-year'] = localStorage.getItem('academicYear') || '2025-26';
  return config;
});

export const fetchDashboard = () =>
  api.get('/dashboard').then(r => r.data);

// Transport — Vehicles
export const fetchVehicles = (params?: any) =>
  api.get('/transport/vehicles', { params }).then(r => r.data);
export const createVehicle = (data: any) =>
  api.post('/transport/vehicles', data).then(r => r.data);
export const updateVehicle = (id: string, data: any) =>
  api.put(`/transport/vehicles/${id}`, data).then(r => r.data);

// Buildings
export const fetchBuildings = (params?: any) =>
  api.get('/buildings', { params }).then(r => r.data);
export const createBuilding = (data: any) =>
  api.post('/buildings', data).then(r => r.data);
export const updateBuilding = (id: string, data: any) =>
  api.put(`/buildings/${id}`, data).then(r => r.data);
export const deleteBuilding = (id: string) =>
  api.delete(`/buildings/${id}`).then(r => r.data);

// Campus Rooms (distinct from Hostel rooms)
export const fetchCampusRooms = (params?: any) =>
  api.get('/rooms', { params }).then(r => r.data);
export const createCampusRoom = (data: any) =>
  api.post('/rooms', data).then(r => r.data);
export const updateCampusRoom = (id: string, data: any) =>
  api.put(`/rooms/${id}`, data).then(r => r.data);
export const deleteCampusRoom = (id: string) =>
  api.delete(`/rooms/${id}`).then(r => r.data);

// Transport — Routes
export const fetchRoutes = (params?: any) =>
  api.get('/transport/routes', { params }).then(r => r.data);
export const createRoute = (data: any) =>
  api.post('/transport/routes', data).then(r => r.data);
export const updateRoute = (id: string, data: any) =>
  api.put(`/transport/routes/${id}`, data).then(r => r.data);
export const getRouteStudents = (routeId: string) =>
  api.get(`/transport/routes/${routeId}/students`).then(r => r.data);
export const allocateTransport = (data: any) =>
  api.post('/transport/students', data).then(r => r.data);

// Hostel — Blocks
export const fetchBlocks = (params?: any) =>
  api.get('/hostel/blocks', { params }).then(r => r.data);
export const createBlock = (data: any) =>
  api.post('/hostel/blocks', data).then(r => r.data);

// Hostel — Rooms
export const fetchRooms = (params?: any) =>
  api.get('/hostel/rooms', { params }).then(r => r.data);
export const createRoom = (data: any) =>
  api.post('/hostel/rooms', data).then(r => r.data);

// Hostel — Allocations
export const fetchAllocations = (params?: any) =>
  api.get('/hostel/allocations', { params }).then(r => r.data);
export const allocateHostel = (data: any) =>
  api.post('/hostel/allocations', data).then(r => r.data);
export const checkOutHostel = (id: string) =>
  api.patch(`/hostel/allocations/${id}/checkout`).then(r => r.data);

// Maintenance
export const fetchMaintenance = (params?: any) =>
  api.get('/maintenance', { params }).then(r => r.data);
export const fetchMaintenanceStats = () =>
  api.get('/maintenance/stats').then(r => r.data);
export const createMaintenance = (data: any) =>
  api.post('/maintenance', data).then(r => r.data);
export const updateMaintenanceStatus = (id: string, data: any) =>
  api.patch(`/maintenance/${id}/status`, data).then(r => r.data);

// Assets
export const fetchAssets = (params?: any) =>
  api.get('/assets', { params }).then(r => r.data);
export const getAssetSummary = () =>
  api.get('/assets/summary').then(r => r.data);
export const createAsset = (data: any) =>
  api.post('/assets', data).then(r => r.data);
export const updateAsset = (id: string, data: any) =>
  api.put(`/assets/${id}`, data).then(r => r.data);
export const disposeAsset = (id: string, reason: string) =>
  api.patch(`/assets/${id}/dispose`, { reason }).then(r => r.data);

// Events
export const fetchEvents = (params?: any) =>
  api.get('/events', { params }).then(r => r.data);
export const createEvent = (data: any) =>
  api.post('/events', data).then(r => r.data);
export const updateEvent = (id: string, data: any) =>
  api.put(`/events/${id}`, data).then(r => r.data);
export const updateEventStatus = (id: string, status: string, attendance?: number) =>
  api.patch(`/events/${id}/status`, { status, attendance }).then(r => r.data);
