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

export const customerApi = {
  getCustomers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/customers${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch customers');
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
  getList: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory`, {
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
  getAllBatches: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/inventory/batches/all`, {
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
