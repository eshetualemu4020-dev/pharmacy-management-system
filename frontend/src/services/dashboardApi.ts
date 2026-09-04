import api from './api';

export const dashboardApi = {
  getAdminStats: async () => {
    const response = await api.get('/dashboard/admin/stats');
    return response.data;
  },

  getPharmacistStats: async () => {
    const response = await api.get('/dashboard/pharmacist/stats');
    return response.data;
  },
};
