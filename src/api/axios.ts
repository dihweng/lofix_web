import axios from 'axios';

export const resolveApiBaseUrl = (configuredUrl: string | undefined, isDevelopment: boolean) =>
  configuredUrl || (isDevelopment ? 'http://localhost:4000' : 'https://api.lofix.ng');

const BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.DEV);

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

const isPublicAuthEndpoint = (url?: string) => {
  let pathname: string;
  try { pathname = new URL(url || '', BASE_URL).pathname.replace(/\/+$/, ''); }
  catch { return false; }
  return [
    '/accounts/login',
    '/accounts/authenticate',
    '/accounts/register',
    '/accounts/verify-email',
    '/accounts/verify-phone',
    '/accounts/refresh-token',
    '/accounts/forgot-password',
    '/accounts/validate-reset-token',
    '/accounts/reset-password',
  ].includes(pathname || '');
};

// Never attach bearer credentials to public authentication requests.
apiClient.interceptors.request.use((config) => {
  const token = tokenGetter?.();
  if (isPublicAuthEndpoint(config.url)) {
    config.headers.delete('Authorization');
  } else if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Share refresh work across startup and protected requests; never log session data.
let refreshPromise: Promise<import('./auth').AuthResponse> | null = null;

export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios.post<import('./auth').AuthResponse>(
      `${BASE_URL}/accounts/refresh-token`, {}, { withCredentials: true }
    ).then((response) => response.data).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorResponse = error.response;

    // Handle ACCESS_TOKEN_EXPIRED or HTTP 401 Unauthorized (excluding login & refresh endpoints)
    const isUnauthorized = errorResponse?.status === 401;

    if (
      isUnauthorized &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthEndpoint(originalRequest.url) &&
      !originalRequest.url?.includes('/accounts/revoke-token')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await refreshSession();

        const newJwtToken = refreshResponse.jwtToken;
        if (!newJwtToken) throw new Error('Invalid session response');
        if (tokenSetter && newJwtToken) {
          tokenSetter(newJwtToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newJwtToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
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
          console.error('[AxiosAuth] Session refresh unavailable');
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
