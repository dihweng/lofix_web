import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send HTTP-only refresh cookies (credentials: include)
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenGetter: (() => string | null) | null = null;
let tokenSetter: ((token: string | null) => void) | null = null;
let logoutHandler: (() => void) | null = null;

export const configureAxiosAuth = (
  getToken: () => string | null,
  setToken: (token: string | null) => void,
  onLogout: () => void
) => {
  tokenGetter = getToken;
  tokenSetter = setToken;
  logoutHandler = onLogout;
};

// Request Interceptor: Inject JWT token if available & Log Request Details (Dev only)
apiClient.interceptors.request.use((config) => {
  const token = tokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    console.group(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Request Headers:', config.headers);
    if (config.data) {
      console.log('Request Body:', config.data);
    }
    console.groupEnd();
  }

  return config;
});

// Response Interceptor: Handle 401 (ACCESS_TOKEN_EXPIRED), Shared Refresh Promise, & Log Response Details
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.group(`✅ [API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('Response Headers:', response.headers);
      console.log('Response Body:', response.data);
      console.groupEnd();
    }
    return response;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.group(`❌ [API Error] ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.log('Error Message:', error.message);
      if (error.response?.data) {
        console.log('Error Data Body:', error.response.data);
      }
      console.groupEnd();
    }

    const originalRequest = error.config;
    const errorResponse = error.response;
    const errorCode = errorResponse?.data?.code;

    // Handle ACCESS_TOKEN_EXPIRED or HTTP 401 Unauthorized (excluding login & refresh endpoints)
    const isUnauthorized =
      errorResponse?.status === 401 ||
      errorCode === 'ACCESS_TOKEN_EXPIRED';

    if (
      isUnauthorized &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/accounts/authenticate') &&
      !originalRequest.url?.includes('/accounts/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/accounts/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newJwtToken = refreshResponse.data.jwtToken;
        if (tokenSetter && newJwtToken) {
          tokenSetter(newJwtToken);
        }

        processQueue(null, newJwtToken);
        originalRequest.headers.Authorization = `Bearer ${newJwtToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        processQueue(refreshErr, null);
        const refreshStatus = refreshErr.response?.status;
        if (refreshStatus === 429) {
          const retryAfter = refreshErr.response?.headers?.['retry-after'] || 30;
          console.warn(`[AxiosAuth] Refresh rate limited (429). Retry after: ${retryAfter}s`);
        } else if (refreshStatus === 401) {
          // Refresh session expired/invalid - clear local authentication without calling revoke-token
          if (logoutHandler) {
            logoutHandler();
          }
        } else {
          console.error('[AxiosAuth] Refresh token network or server error:', refreshErr.message);
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
