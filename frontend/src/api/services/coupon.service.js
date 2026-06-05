import api from '../request';

export const couponApi = {
  getPublicList: () => api.get('/coupons/public'),
  claim: (id) => api.post(`/coupons/${id}/claim`),
  getMyList: (params) => api.get('/coupons/my', { params }),
  getMyAvailable: () => api.get('/coupons/my/available')
};
