import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, LoginCredentials, authApi } from '../api/auth';
import { configureAxiosAuth } from '../api/axios';

interface AgentAuthContextType {
  user: Account | null;
  jwtToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

const AGENT_TOKEN_KEY = 'lofix_agent_jwt';

export const AgentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Account | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(() => localStorage.getItem(AGENT_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setToken = useCallback((newToken: string | null) => {
    setJwtToken(newToken);
    if (newToken) {
      localStorage.setItem(AGENT_TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(AGENT_TOKEN_KEY);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (jwtToken) {
      try {
        await authApi.revokeToken(jwtToken);
      } catch {
        // Ignore revocation error
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await authApi.refreshToken();
        if (data.role !== 'Agent') {
          await authApi.revokeToken(data.jwtToken);
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
    };

    initAuth();
  }, [setToken]);

  const login = async (credentials: LoginCredentials) => {
    const data = await authApi.login(credentials);
    if (data.role !== 'Agent') {
      await authApi.revokeToken(data.jwtToken);
      throw new Error('Access Denied: Only Agent accounts can access the Agent Portal.');
    }
    setUser(data);
    setToken(data.jwtToken);
  };

  return (
    <AgentAuthContext.Provider
      value={{
        user,
        jwtToken,
        isAuthenticated: !!user && user.role === 'Agent',
        isLoading,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AgentAuthContext.Provider>
  );
};

export const useAgentAuth = (): AgentAuthContextType => {
  const context = useContext(AgentAuthContext);
  if (!context) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};
