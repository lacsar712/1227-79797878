import api from '../request';

export const categoriesApi = {
  list: () => api.get('/categories')
};
