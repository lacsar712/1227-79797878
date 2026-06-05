import api from '../request';

export const wishlistApi = {
  list: () => api.get('/wishlists'),
  detail: (id) => api.get(`/wishlists/${id}`),
  create: (name) => api.post('/wishlists', { name }),
  update: (id, name) => api.put(`/wishlists/${id}`, { name }),
  remove: (id) => api.delete(`/wishlists/${id}`),
  addItem: (id, productId) => api.post(`/wishlists/${id}/items`, { product_id: productId }),
  removeItem: (id, itemId) => api.delete(`/wishlists/${id}/items/${itemId}`),
  share: (id) => api.post(`/wishlists/${id}/share`),
  unshare: (id) => api.post(`/wishlists/${id}/unshare`),
  getShared: (shareCode) => api.get(`/wishlists/share/${shareCode}`),
  addToCart: (shareCode, productIds) =>
    api.post(`/wishlists/share/${shareCode}/add-to-cart`, { product_ids: productIds })
};
