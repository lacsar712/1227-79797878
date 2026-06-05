import api from '../request';

export const ticketsApi = {
  getCategories: () => api.get('/tickets/categories'),
  create: (data) => api.post('/tickets', data),
  list: (params) => api.get('/tickets', { params }),
  detail: (id) => api.get(`/tickets/${id}`),
  reply: (id, content) => api.post(`/tickets/${id}/reply`, { content }),
  close: (id) => api.put(`/tickets/${id}/close`),
  staffReply: (id, data) => api.post(`/tickets/${id}/staff-reply`, data)
};
