import api from './request';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  getMemberLevels: () => api.get('/auth/member-levels')
};

export const categoriesApi = {
  list: () => api.get('/categories')
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  detail: (id) => api.get(`/products/${id}`)
};

export const cartApi = {
  list: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  updateQuantity: (id, quantity) => api.put(`/cart/${id}/quantity`, { quantity }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart')
};

export const addressesApi = {
  list: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  remove: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.put(`/addresses/${id}/default`)
};

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/create', data),
  pay: (id) => api.post(`/orders/${id}/pay`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  complete: (id) => api.post(`/orders/${id}/complete`)
};

export const groupBuyApi = {
  getActivity: (productId) => api.get(`/group-buy/activity/${productId}`),
  detail: (id) => api.get(`/group-buy/${id}`),
  my: (params) => api.get('/group-buy/my', { params }),
  create: (data) => api.post('/group-buy/create', data),
  join: (id, data) => api.post(`/group-buy/${id}/join`, data)
};

export const giftCardApi = {
  getDenominations: () => api.get('/gift-cards/denominations'),
  getMyCards: () => api.get('/gift-cards/my'),
  getAvailableCards: () => api.get('/gift-cards/my/available'),
  purchase: (amount) => api.post('/gift-cards/purchase', { amount }),
  bind: (cardNo) => api.post('/gift-cards/bind', { card_no: cardNo }),
  getDetail: (id) => api.get(`/gift-cards/${id}`)
};

export const stockSubscriptionApi = {
  subscribe: (productId) => api.post(`/stock-subscriptions/${productId}/subscribe`),
  unsubscribe: (productId) => api.delete(`/stock-subscriptions/${productId}/subscribe`),
  getStatus: (productId) => api.get(`/stock-subscriptions/${productId}/status`),
  getMySubscriptions: (params) => api.get('/stock-subscriptions/my', { params })
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: (type) => api.put('/notifications/read-all', { params: { type } }),
  remove: (id) => api.delete(`/notifications/${id}`)
};

export const ticketsApi = {
  getCategories: () => api.get('/tickets/categories'),
  create: (data) => api.post('/tickets', data),
  list: (params) => api.get('/tickets', { params }),
  detail: (id) => api.get(`/tickets/${id}`),
  reply: (id, content) => api.post(`/tickets/${id}/reply`, { content }),
  close: (id) => api.put(`/tickets/${id}/close`),
  staffReply: (id, data) => api.post(`/tickets/${id}/staff-reply`, data)
};

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
