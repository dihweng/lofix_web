import { apiClient, refreshSession } from './axios';

export interface Account {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: 'Admin' | 'User' | 'Agent';
  isVerified?: boolean;
  activated?: boolean;
  isPhoneVerified?: boolean;
  created?: string;
  updated?: string;
}

export interface AuthResponse extends Account {
  jwtToken: string;
}

export interface CreateAccountPayload {
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role?: 'Admin' | 'User' | 'Agent';
}

export interface RegistrationPayload {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  acceptTerms: true;
}

export interface RegistrationResponse {
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  title?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  requiresLogin?: boolean;
}

export const authApi = {
  forgotPassword: async (email: string): Promise<{ message: string }> =>
    (await apiClient.post('/accounts/forgot-password', { email })).data,
  validateResetToken: async (token: string): Promise<{ message: string }> =>
    (await apiClient.post('/accounts/validate-reset-token', { token })).data,
  resetPassword: async (payload: { token: string; password: string; confirmPassword: string }): Promise<{ message: string }> =>
    (await apiClient.post('/accounts/reset-password', payload)).data,

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/accounts/authenticate', credentials);
    return response.data;
  },

  register: async (payload: RegistrationPayload): Promise<RegistrationResponse> => {
    const response = await apiClient.post<RegistrationResponse>('/accounts/register', payload);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/accounts/verify-email', { token });
    return response.data;
  },

  verifyPhone: async (token: string, phoneNumber: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/accounts/verify-phone', { token, phoneNumber });
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    return refreshSession();
  },

  revokeToken: async (token?: string, accessToken?: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/accounts/revoke-token',
      { token },
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
    );
    return response.data;
  },

  getAccounts: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>('/accounts');
    return response.data;
  },

  createAccount: async (payload: CreateAccountPayload): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts', {
      ...payload,
      role: payload.role || 'User',
    });
    return response.data;
  },

  updateProfile: async (id: number, payload: UpdateProfilePayload): Promise<Account> => {
    const response = await apiClient.put<Account>(`/accounts/${id}`, payload);
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
    const response = await apiClient.post<ChangePasswordResponse>('/accounts/change-password', payload);
    return response.data;
  },

  deleteAccount: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/accounts/${id}`);
    return response.data;
  },

  requestPhoneOtp: async (phoneNumber: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/accounts/login', { phoneNumber });
    return res.data;
  },

  verifyPhoneOtp: async (token: string, phoneNumber: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/accounts/verify-phone', { token, phoneNumber });
    return res.data;
  },
};
