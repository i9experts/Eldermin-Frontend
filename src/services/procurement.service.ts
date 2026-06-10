import api from '../lib/api';

const procurementService = {
  getDashboard: async () => {
    const { data } = await api.get('/procurement/dashboard');
    return data;
  },
  getVendors: async () => {
    const { data } = await api.get('/procurement/vendors');
    return data;
  },
  createVendor: async (payload: any) => {
    const { data } = await api.post('/procurement/vendors', payload);
    return data;
  },
  updateVendor: async (id: string, payload: any) => {
    const { data } = await api.patch(`/procurement/vendors/${id}`, payload);
    return data;
  },
  approveVendor: async (id: string) => {
    const { data } = await api.patch(`/procurement/vendors/${id}/approve`, {});
    return data;
  },
  getPurchaseOrders: async () => {
    const { data } = await api.get('/procurement/purchase-orders');
    return data;
  },
  createPurchaseOrder: async (payload: any) => {
    const { data } = await api.post('/procurement/purchase-orders', payload);
    return data;
  },
  updatePOStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/procurement/purchase-orders/${id}/status`, { status });
    return data;
  },
  getInventoryItems: async () => {
    const { data } = await api.get('/procurement/inventory');
    return data;
  },
  createInventoryItem: async (payload: any) => {
    const { data } = await api.post('/procurement/inventory', payload);
    return data;
  },
  updateInventoryItem: async (id: string, payload: any) => {
    const { data } = await api.patch(`/procurement/inventory/${id}`, payload);
    return data;
  },
  getLowStockItems: async () => {
    const { data } = await api.get('/procurement/inventory/low-stock');
    return data;
  },
};

export default procurementService;
