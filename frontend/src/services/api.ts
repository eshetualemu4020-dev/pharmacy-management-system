const API_BASE_URL = 'http://localhost:8000';

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection or try again later.');
      }
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }
      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection or try again later.');
      }
      throw error;
    }
  }
};

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
});

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  return response;
};

export const userApi = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
    return data;
  },
  createUser: async (userData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  },
  updateUser: async (id, userData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },
  updateStatus: async (id, status) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update user status');
    return data;
  },
  resetPassword: async (id, newPassword) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  }
};



export const categoryApi = {
  getCategories: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data;
  },
  getCategoryById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch category');
    return data;
  },
  createCategory: async (categoryData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create category');
    return data;
  },
  updateCategory: async (id, categoryData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update category');
    return data;
  },
  updateStatus: async (id, status) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update category status');
    return data;
  },
  deleteCategory: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Failed to delete category');
    return data;
  }
};

export const drugApi = {
  getAll: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/drugs${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch drugs');
    return data;
  },
  getById: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/drugs/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch drug');
    return data;
  },
  create: async (drugData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/drugs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(drugData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create drug');
    return data;
  },
  update: async (id: number, drugData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/drugs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(drugData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update drug');
    return data;
  },
  updateStatus: async (id: number, is_active: boolean) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/drugs/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update drug status');
    return data;
  }
};

export const inventoryApi = {
  getSummary: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory/summary`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch inventory summary');
    return data;
  },
  getList: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch inventory list');
    return data;
  },
  getBatches: async (drugId: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory/${drugId}/batches`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch batches');
    return data;
  },
  getAllBatches: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory/batches/all${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch all batches');
    return data;
  },
  adjustStock: async (adjustmentData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adjustmentData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to adjust stock');
    return data;
  },
  getTransactions: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory/transactions/history`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch transactions');
    return data;
  }
};

export const supplierApi = {
  getSuppliers: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/suppliers${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch suppliers');
    return data;
  },
  getSupplierById: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/suppliers/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch supplier');
    return data;
  },
  createSupplier: async (supplierData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/suppliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(supplierData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create supplier');
    return data;
  },
  updateSupplier: async (id: number, supplierData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/suppliers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(supplierData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update supplier');
    return data;
  },
  updateStatus: async (id: number, status: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/suppliers/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update supplier status');
    return data;
  }
};

export const purchaseOrderApi = {
  getAll: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/purchase-orders${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch purchase orders');
    return data;
  },
  getById: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/purchase-orders/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch purchase order details');
    return data;
  },
  create: async (poData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/purchase-orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(poData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create purchase order');
    return data;
  },
  updateStatus: async (id: number, status: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/purchase-orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update purchase order status');
    return data;
  },
  receive: async (id: number, receiveData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/purchase-orders/${id}/receive`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(receiveData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to receive purchase order');
    return data;
  }
};

export const salesApi = {
  getAll: async (params?: {
    search?: string;
    payment_status?: string;
    sale_status?: string;
    date_range?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    let url = `${API_BASE_URL}/api/sales`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await fetchWithAuth(url, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch sales');
    return data;
  },
  getSummary: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/sales/summary`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch sales summary');
    return data;
  },
  getById: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/sales/${id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch sale details');
    return data;
  },
  create: async (saleData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create sale');
    return data;
  },
  refund: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/sales/${id}/refund`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to refund sale');
    return data;
  }
};

export const orderApi = {
  getOrders: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/orders${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
    return data;
  },
  getOrderById: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/orders/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch order details');
    return data;
  },
  updateOrderStatus: async (id: number, statusData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update order status');
    return data;
  },
  cancelOrder: async (id: number, reason: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/orders/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to cancel order');
    return data;
  }
};

export const promotionApi = {
  getPromotions: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/promotions${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch promotions');
    return data;
  },
  getPromotionById: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/promotions/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch promotion');
    return data;
  },
  createPromotion: async (promotionData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/promotions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(promotionData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create promotion');
    return data;
  },
  updatePromotion: async (id: number, promotionData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/promotions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(promotionData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update promotion');
    return data;
  },
  updateStatus: async (id: number, status: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/promotions/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update promotion status');
    return data;
  }
};

export const reportApi = {
  getDashboardSummary: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/dashboard${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  },
  getSalesReport: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/sales${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  },
  getInventoryReport: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/inventory`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  },
  getOrderReport: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/orders${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  },
  getPrescriptionReport: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/prescriptions${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  },
  getProductReport: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/products${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  },
  getCustomerReport: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/customers${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch report');
    return data;
  }
};

export const auditApi = {
  getLogs: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/audit-logs${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch audit logs');
    return data;
  }
};

export const settingsApi = {
  getSettings: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/settings`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch settings');
    return data;
  },
  updateSettings: async (settings: Record<string, any>) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update settings');
    return data;
  }
};

export const prescriptionApi = {
  getPrescriptions: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/prescriptions${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch prescriptions');
    return data;
  },
  getPrescriptionById: async (id: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/prescriptions/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch prescription details');
    return data;
  },
  reviewPrescription: async (id: number | string, reviewData: { status: string, notes?: string }) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/prescriptions/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to review prescription');
    return data;
  },
  getPrescriptionFileUrl: (id: number | string) => `${API_BASE_URL}/api/admin/prescriptions/${id}/file`
};

export const customerApi = {
  getCustomerStats: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/stats`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch customer stats');
    return data;
  },
  getCustomers: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch customers');
    return data;
  },
  getCustomerById: async (id: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch customer details');
    return data;
  },
  getCustomerOrders: async (id: number | string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/${id}/orders${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch customer orders');
    return data;
  },
  getCustomerSales: async (id: number | string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/${id}/sales${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch customer sales');
    return data;
  },
  getCustomerPrescriptions: async (id: number | string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/${id}/prescriptions${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch customer prescriptions');
    return data;
  }
};

export const reportsApi = {
  getSales: async (params: { startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/sales${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch sales report');
    return data;
  },
  getProducts: async (params: { startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/products${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch products report');
    return data;
  },
  getInventory: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/inventory`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch inventory report');
    return data;
  },
  getOrders: async (params: { startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/orders${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch orders report');
    return data;
  },
  getPrescriptions: async (params: { startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/prescriptions${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch prescriptions report');
    return data;
  }
};

export const profileApi = {
  getProfile: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/profile`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },
  updateProfile: async (payload: { username: string; phone?: string }) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/profile/password`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  }
};

export const cartApi = {
  getCart: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/cart`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch cart');
    return data;
  },
  addToCart: async (item: { drug_id: number, quantity: number }) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add to cart');
    return data;
  },
  updateCartItem: async (itemId: number, quantity: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/cart/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update cart item');
    return data;
  },
  removeFromCart: async (itemId: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/cart/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to remove from cart');
    return data;
  },
  clearCart: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to clear cart');
    return data;
  },
  validateCart: async (promotion_id?: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/cart/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ promotion_id })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Cart validation failed');
    return data;
  }
};

export const wishlistApi = {
  getWishlist: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/wishlist`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch wishlist');
      return data;
    } catch {
      return [];
    }
  },
  addToWishlist: async (drugId: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ drugId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add to wishlist');
    return data;
  },
  removeFromWishlist: async (drugId: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/wishlist/${drugId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to remove from wishlist');
    return data;
  }
};

export const catalogApi = {
  getDrugs: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog/drugs${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch catalog');
    return data;
  },
  getDrugById: async (id: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog/drugs/${id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch catalog drug');
    return data;
  },
  getCategories: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog/categories${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch catalog categories');
    return data;
  },
  getDosageForms: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog/dosage-forms`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch dosage forms');
    return data;
  }
};

export const customerOrderApi = {
  getOrders: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/orders${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch your orders');
    return data;
  },
  getOrderDetails: async (id: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/orders/${id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch order details');
    return data;
  },
  cancelOrder: async (id: number | string, reason?: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/orders/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to cancel order');
    return data;
  },
  checkout: async (checkoutData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/orders/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(checkoutData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to checkout');
    return data;
  },
  confirmPayment: async (orderId: number | string, paymentIntentId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/orders/${orderId}/confirm-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ payment_intent_id: paymentIntentId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to confirm payment');
    return data;
  }
};

export const customerPrescriptionApi = {
  getPrescriptions: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/prescriptions${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch prescriptions');
    return data;
  },
  getEligibleOrders: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/prescriptions/eligible-orders`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch eligible orders');
    return data;
  },
  getPrescriptionDetails: async (id: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/prescriptions/${id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch prescription details');
    return data;
  },
  uploadPrescription: async (formData: FormData) => {
    const headers: any = getAuthHeaders();
    delete headers['Content-Type']; // Let browser set multipart/form-data boundary
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customer/prescriptions/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to upload prescription');
    return data;
  },
  getPrescriptionFileUrl: (id: number | string) => `${API_BASE_URL}/api/customer/prescriptions/${id}/file`
};

export const notificationApi = {
  getNotifications: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch notifications');
    return data;
  },
  getUnreadCount: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/unread-count`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch unread count');
    return data;
  },
  markAsRead: async (id: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${id}/read`, { 
      method: 'PUT',
      headers: getAuthHeaders() 
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to mark notification as read');
    return data;
  },
  markAllAsRead: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/mark-all-read`, { 
      method: 'PUT',
      headers: getAuthHeaders() 
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to mark all notifications as read');
    return data;
  }
};

export const customerProfileApi = {
  getProfile: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/profile`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },
  updateProfile: async (profileData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },
  changePassword: async (passwordData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/profile/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },
  getAddresses: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/addresses`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch addresses');
    return data;
  },
  addAddress: async (addressData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add address');
    return data;
  },
  updateAddress: async (id: number, addressData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/addresses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update address');
    return data;
  },
  deleteAddress: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/addresses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete address');
    return data;
  },
  setDefaultAddress: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/addresses/${id}/default`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to set default address');
    return data;
  },
  getPreferences: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/preferences`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch preferences');
    return data;
  },
  updatePreferences: async (preferencesData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferencesData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update preferences');
    return data;
  }
};

export const supportApi = {
  getTickets: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/support/tickets`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch support tickets');
    return data;
  },
  getTicketDetails: async (id: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/support/tickets/${id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch ticket details');
    return data;
  },
  createTicket: async (ticketData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create ticket');
    return data;
  },
  replyToTicket: async (id: number, messageData: any) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/support/tickets/${id}/responses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to post reply');
    return data;
  }
};

export const dashboardApi = {
  getAdminStats: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/admin/stats`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch admin stats');
    return data;
  },
  getPharmacistStats: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/pharmacist/stats`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch pharmacist stats');
    return data;
  }
};
