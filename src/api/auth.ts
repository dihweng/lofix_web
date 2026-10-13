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
  acceptTerms?: boolean;
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
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/accounts/authenticate', credentials);
    return response.data;
  },

  register: async (payload: CreateAccountPayload): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts/register', payload);
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    return refreshSession();
  },

  revokeToken: async (token?: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/accounts/revoke-token', { token });
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

  requestPhoneOtp: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/accounts/request-phone-otp');
    return res.data;
  },

  verifyPhoneOtp: async (otp: string): Promise<{ message: string; isPhoneVerified: boolean }> => {
    const res = await apiClient.post<{ message: string; isPhoneVerified: boolean }>('/accounts/verify-phone', { otp });
    return res.data;
  },

  verifyEmail: async (otp: string): Promise<{ message: string; isVerified?: boolean }> => {
    const res = await apiClient.post<{ message: string; isVerified?: boolean }>('/accounts/verify-email', { otp });
    return res.data;
  },
};
