import apiClient from './client';

export const authAPI = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getCooks: () => apiClient.get('/users/cooks'),
};

export const menusAPI = {
  list: (date) => apiClient.get('/menus', { params: { date } }),
  getById: (id) => apiClient.get(`/menus/${id}`),
  create: (data) => apiClient.post('/menus', data),
  addItem: (menuId, item) => apiClient.post(`/menus/${menuId}/items`, item),
  publish: (menuId) => apiClient.put(`/menus/${menuId}/publish`),
};

export const paymentsAPI = {
  createIntent: (orderId) => apiClient.post('/payments/intent', { orderId }),
  confirm: (orderId, paymentIntentId) => apiClient.post('/payments/confirm', { orderId, paymentIntentId }),
};

export const ordersAPI = {
  create: (data) => apiClient.post('/orders', data),
  getById: (id) => apiClient.get(`/orders/${id}`),
  listMine: () => apiClient.get('/orders/my'),
  listCookOrders: () => apiClient.get('/orders/cook'),
  updateStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),
};
