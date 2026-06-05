import api from '../request';

export const liveStreamApi = {
  list: (params) => api.get('/live-streams', { params }),
  active: () => api.get('/live-streams/active'),
  detail: (id) => api.get(`/live-streams/${id}`)
};
