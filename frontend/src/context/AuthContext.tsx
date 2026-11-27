import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization?: {
    id: number | null;
    name: string;
    logo_url?: string | null;
    website?: string | null;
    contact_email?: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User['organization']> & { full_name?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('certiflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      // In development or local demo, default user is auto provided by backend get_current_user
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('certiflow_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const register = async (email: string, password: string, fullName: string, orgName: string) => {
    const res = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      organization_name: orgName,
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('certiflow_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('certiflow_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: any) => {
    await api.put('/auth/profile', data);
    await fetchProfile();
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
