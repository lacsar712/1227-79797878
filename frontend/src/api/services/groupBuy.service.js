import api from '../request';

export const groupBuyApi = {
  getActivity: (productId) => api.get(`/group-buy/activity/${productId}`),
  detail: (id) => api.get(`/group-buy/${id}`),
  my: (params) => api.get('/group-buy/my', { params }),
  create: (data) => api.post('/group-buy/create', data),
  join: (id, data) => api.post(`/group-buy/${id}/join`, data)
};
