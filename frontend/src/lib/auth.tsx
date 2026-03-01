import { useState, type ReactNode } from 'react';
import api from './api';
import { TOKEN_KEY } from './constants';
import type { User, LoginResponse } from '../types';
import { AuthContext } from '../hooks/useAuth';

// =============================================================================
// Auth Context — JWT token management + user state
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );

  // We don't have a /me endpoint yet, so we trust the stored token on load
  // without any async validation, which avoids the cascading render warning.

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
        isLoading: false,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
