import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, LoginCredentials, CreateAccountPayload, UpdateProfilePayload, authApi } from '../api/auth';
import { configureAxiosAuth } from '../api/axios';

interface AuthContextType {
  user: Account | null;
  jwtToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: CreateAccountPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lofix_customer_jwt';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Account | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setToken = useCallback((newToken: string | null) => {
    setJwtToken(newToken);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (jwtToken) {
      try {
        await authApi.revokeToken(jwtToken);
      } catch {
        // Ignore logout revocation errors
      }
    }
    setUser(null);
    setToken(null);
  }, [jwtToken, setToken]);

  useEffect(() => {
    configureAxiosAuth(
      () => jwtToken,
      (token) => setToken(token),
      () => handleLogout()
    );
  }, [jwtToken, setToken, handleLogout]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.refreshToken();
      // If the active HTTP-only cookie belongs to an Admin account, clear it so Customer App starts fresh
      if (data.role === 'Admin') {
        try {
          await authApi.revokeToken(data.jwtToken);
        } catch {
          // Ignore
        }
        setUser(null);
        setToken(null);
      } else {
        setUser(data);
        setToken(data.jwtToken);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    const data = await authApi.login(credentials);
    setUser(data);
    setToken(data.jwtToken);
  };

  const register = async (payload: CreateAccountPayload) => {
    try {
      await authApi.register(payload);
    } catch {
      // Fallback to /accounts if /accounts/register is not present
      await authApi.createAccount(payload);
    }
    // Automatically log in after registration
    await login({ email: payload.email, password: payload.password });
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    if (!user) return;
    const updated = await authApi.updateProfile(user.id, payload);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        jwtToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
