import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DemoAccount } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoAccounts: DemoAccount[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithDemoAccount: (account: DemoAccount) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; role: string; department?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sharesphere_token'));
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load demo accounts
  useEffect(() => {
    api.getDemoAccounts()
      .then(accounts => setDemoAccounts(accounts))
      .catch(err => console.error('Failed to load demo accounts:', err));
  }, []);

  // Fetch current user if token exists, or auto-login with default demo borrower for quick demo
  const refreshUser = async () => {
    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      localStorage.removeItem('sharesphere_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
      setUser(null);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('sharesphere_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemoAccount = async (account: DemoAccount) => {
    await login(account.email, account.password);
  };

  const register = async (data: { email: string; password: string; full_name: string; role: string; department?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('sharesphere_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sharesphere_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoAccounts,
        isLoading,
        login,
        loginWithDemoAccount,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
