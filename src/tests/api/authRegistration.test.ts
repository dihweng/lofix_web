import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { authApi } from '../../api/auth';
import { apiClient, configureAxiosAuth, resolveApiBaseUrl } from '../../api/axios';

const originalAdapter = apiClient.defaults.adapter;
const requests: InternalAxiosRequestConfig[] = [];

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  apiClient.defaults.headers.common.Authorization = undefined;
  requests.length = 0;
  configureAxiosAuth(() => null, () => {}, () => {});
  localStorage.clear();
  vi.restoreAllMocks();
});

it('registers without a bearer token and sends exactly the public registration payload', async () => {
  const payload = {
    title: 'Ms',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phoneNumber: '08012345678',
    password: 'pass1234',
    confirmPassword: 'pass1234',
    acceptTerms: true as const,
  };

  configureAxiosAuth(() => 'existing-session-token', () => {}, () => {});
  apiClient.defaults.headers.common.Authorization = 'Bearer stale-session-token';
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    return {
      data: { message: 'Check your phone or email for verification instructions' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  apiClient.defaults.adapter = adapter;

  await expect(authApi.register(payload)).resolves.toEqual({
    message: 'Check your phone or email for verification instructions',
  });

  expect(requests).toHaveLength(1);
  expect(requests[0].url).toBe('/accounts/register');
  expect(requests[0].baseURL).toBe(apiClient.defaults.baseURL);
  expect(requests[0].baseURL).not.toContain('api.lofix.com');
  expect(requests[0].withCredentials).toBe(true);
  expect(requests[0].headers.get('Authorization')).toBeUndefined();
  expect(JSON.parse(String(requests[0].data))).toEqual(payload);
});

it('resolves local and production API defaults without a stale host', () => {
  expect(resolveApiBaseUrl(undefined, true)).toBe('http://localhost:4000');
  expect(resolveApiBaseUrl(undefined, false)).toBe('https://api.lofix.ng');
  expect(resolveApiBaseUrl('https://api.lofix.ng', false)).toBe('https://api.lofix.ng');
});

it('uses the API verification token and phone-number request shapes', async () => {
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    return {
      data: config.url === '/accounts/verify-email'
        ? { message: 'Verification successful, you can now login' }
        : { id: 12, role: 'User', jwtToken: 'issued-after-phone-verification' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  apiClient.defaults.adapter = adapter;

  configureAxiosAuth(() => 'existing-session-token', () => {}, () => {});
  await authApi.requestPhoneOtp('08012345678');
  await authApi.verifyEmail('email-verification-token');
  await authApi.verifyPhone('phone-code', '08012345678');
  await authApi.login({ email: 'jane@example.com', password: 'pass1234' });

  expect(requests.map((request) => request.url)).toEqual([
    '/accounts/login',
    '/accounts/verify-email',
    '/accounts/verify-phone',
    '/accounts/authenticate',
  ]);
  expect(requests.map((request) => JSON.parse(String(request.data)))).toEqual([
    { phoneNumber: '08012345678' },
    { token: 'email-verification-token' },
    { token: 'phone-code', phoneNumber: '08012345678' },
    { email: 'jane@example.com', password: 'pass1234' },
  ]);
  expect(requests.every((request) => request.headers.get('Authorization') === undefined)).toBe(true);
});

it.each(['/accounts/login', '/accounts/authenticate', '/accounts/register', '/accounts/verify-email', '/accounts/verify-phone', '/accounts/forgot-password', '/accounts/validate-reset-token', '/accounts/reset-password', '/accounts/refresh-token'])('public failure at %s never refreshes or sends Authorization', async (path) => {
  const axios = (await import('axios')).default;
  const refresh = vi.spyOn(axios, 'post');
  configureAxiosAuth(() => 'private-token', () => {}, () => {});
  apiClient.defaults.headers.common.Authorization = 'Bearer stale';
  apiClient.defaults.adapter = async config => {
    requests.push(config);
    throw { config, response: { status: 401, data: { message: 'Original API error' } } };
  };
  await expect(apiClient.post(`${path}/?query=value`, {})).rejects.toMatchObject({ response: { data: { message: 'Original API error' } } });
  expect(requests[0].headers.get('Authorization')).toBeUndefined();
  expect(refresh).not.toHaveBeenCalled();
});

it.each([400, 429])('protected HTTP %s never refreshes even with an expired-token code', async status => {
  const axios = (await import('axios')).default;
  const refresh = vi.spyOn(axios, 'post');
  apiClient.defaults.adapter = async config => { throw { config, response: { status, data: { code: 'ACCESS_TOKEN_EXPIRED' } } }; };
  await expect(apiClient.get('/accounts/123')).rejects.toMatchObject({ response: { status } });
  expect(refresh).not.toHaveBeenCalled();
});

it('does not log credential-bearing requests, responses or errors', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  apiClient.defaults.adapter = async config => ({ data: { jwtToken: 'secret-jwt' }, status: 200, statusText: 'OK', headers: {}, config });
  await authApi.login({ email: 'test@example.com', password: 'secret-password' });
  apiClient.defaults.adapter = async config => { throw { config, response: { status: 400, data: { message: 'secret-token' } } }; };
  await expect(authApi.verifyEmail('secret-otp')).rejects.toBeDefined();
  expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
});

it('shares one refresh for simultaneous protected failures and retries each once', async () => {
  const axios = (await import('axios')).default;
  let finish!: (value: any) => void;
  const refresh = vi.spyOn(axios, 'post').mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  apiClient.defaults.adapter = async config => {
    requests.push(config);
    if (config.headers.get('Authorization') !== 'Bearer fresh') throw { config, response: { status: 401 } };
    return { config, data: {}, status: 200, statusText: 'OK', headers: {} };
  };
  const first = apiClient.get('/protected/one');
  const second = apiClient.get('/protected/two');
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  finish({ data: { jwtToken: 'fresh' } });
  await Promise.all([first, second]);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(requests).toHaveLength(4);
});
