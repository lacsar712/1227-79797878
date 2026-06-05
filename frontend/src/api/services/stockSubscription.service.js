import api from '../request';

export const stockSubscriptionApi = {
  subscribe: (productId) => api.post(`/stock-subscriptions/${productId}/subscribe`),
  unsubscribe: (productId) => api.delete(`/stock-subscriptions/${productId}/subscribe`),
  getStatus: (productId) => api.get(`/stock-subscriptions/${productId}/status`),
  getMySubscriptions: (params) => api.get('/stock-subscriptions/my', { params })
};
