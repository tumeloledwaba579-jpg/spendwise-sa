'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    if (!isBrowser) {
      setIsLoading(false);
      return;
    }
    
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, [isBrowser]);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    const mockUser = { id: '1', email, full_name: 'John Doe' };
    const mockToken = 'mock-jwt-token';
    
    if (isBrowser) {
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    }
    
    setToken(mockToken);
    setUser(mockUser);
    
    return { success: true, data: { access_token: mockToken, user: mockUser } };
  };

  const register = async (data: any) => {
    // TODO: Replace with actual API call
    const mockUser = { 
      id: '1', 
      email: data.email, 
      full_name: data.full_name || 'New User' 
    };
    const mockToken = 'mock-jwt-token';
    
    if (isBrowser) {
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    }
    
    setToken(mockToken);
    setUser(mockUser);
    
    return { success: true, data: { access_token: mockToken, user: mockUser } };
  };

  const logout = () => {
    if (isBrowser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    
    setToken(null);
    setUser(null);
    
    if (isBrowser) {
      window.location.href = '/login';
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
