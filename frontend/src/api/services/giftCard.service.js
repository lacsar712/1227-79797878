import api from '../request';

export const giftCardApi = {
  getDenominations: () => api.get('/gift-cards/denominations'),
  getMyCards: () => api.get('/gift-cards/my'),
  getAvailableCards: () => api.get('/gift-cards/my/available'),
  purchase: (amount) => api.post('/gift-cards/purchase', { amount }),
  bind: (cardNo) => api.post('/gift-cards/bind', { card_no: cardNo }),
  getDetail: (id) => api.get(`/gift-cards/${id}`)
};
