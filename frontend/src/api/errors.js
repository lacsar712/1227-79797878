export const ERROR_CODES = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

export class ApiError extends Error {
  constructor(message, code, data) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  isUnauthorized() {
    return this.code === ERROR_CODES.UNAUTHORIZED;
  }

  isForbidden() {
    return this.code === ERROR_CODES.FORBIDDEN;
  }

  isNotFound() {
    return this.code === ERROR_CODES.NOT_FOUND;
  }

  isValidationError() {
    return this.code === ERROR_CODES.UNPROCESSABLE_ENTITY || this.code === ERROR_CODES.BAD_REQUEST;
  }

  isNetworkError() {
    return this.code === ERROR_CODES.NETWORK_ERROR;
  }

  isTimeout() {
    return this.code === ERROR_CODES.TIMEOUT;
  }

  static fromAxiosError(axiosError) {
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      return new ApiError(
        data?.message || axiosError.message,
        data?.code || status,
        data
      );
    }
    if (axiosError.code === 'ECONNABORTED') {
      return new ApiError('请求超时', ERROR_CODES.TIMEOUT);
    }
    if (axiosError.message === 'Network Error') {
      return new ApiError('网络异常', ERROR_CODES.NETWORK_ERROR);
    }
    return new ApiError(axiosError.message || '未知错误', ERROR_CODES.UNKNOWN);
  }

  static fromResponseData({ code, message, data }) {
    return new ApiError(message || '请求失败', code, data);
  }
}

export function createApiError(message, code, data) {
  return new ApiError(message, code, data);
}

export function isApiError(error) {
  return error instanceof ApiError;
}
