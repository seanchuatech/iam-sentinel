import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from './api';
import { TOKEN_KEY } from './constants';
import type { User, LoginResponse } from '../types';

// =============================================================================
// Auth Context — JWT token management + user state
// =============================================================================

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  // On mount, if token exists, validate it by fetching current user
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    // Token exists — consider user logged in (token is validated via API interceptor)
    // We don't have a /me endpoint yet, so we trust the stored token
    setIsLoading(false);
  }, [token]);

  const login = async (username: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { username, password });
    sessionStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    await api.post('/auth/register', { username, email, password });
    // After registration, auto-login
    await login(username, password);
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
