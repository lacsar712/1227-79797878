import api from '../request';

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: (type) => api.put('/notifications/read-all', { params: { type } }),
  remove: (id) => api.delete(`/notifications/${id}`)
};
