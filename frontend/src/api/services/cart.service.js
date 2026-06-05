import api from '../request';

export const cartApi = {
  list: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  updateQuantity: (id, quantity) => api.put(`/cart/${id}/quantity`, { quantity }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart')
};
