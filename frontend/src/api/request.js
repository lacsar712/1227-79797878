import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { ApiError, ERROR_CODES } from './errors';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(ApiError.fromAxiosError(err))
);

api.interceptors.response.use(
  (res) => {
    const { code, message, data } = res.data;
    if (code === ERROR_CODES.SUCCESS) return data;
    const apiError = ApiError.fromResponseData({ code, message, data });
    ElMessage.error(message || '请求失败');
    return Promise.reject(apiError);
  },
  (err) => {
    const apiError = err instanceof ApiError ? err : ApiError.fromAxiosError(err);
    if (apiError.code === ERROR_CODES.UNAUTHORIZED || err.response?.status === 401) {
      try {
        const store = useUserStore();
        store.logout();
      } catch (_) {}
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else {
      ElMessage.error(apiError.message);
    }
    return Promise.reject(apiError);
  }
);

export default api;
