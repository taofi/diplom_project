'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, AuthState } from './types';
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  removeTokens,
} from '@/lib/cookies';
import api from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAdmin: boolean;
  isAuthor: boolean;
  isAdminOrAuthor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();

      if (token) {
        try {
          const response = await api.get('/auth/me');
          setState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          removeTokens();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data;

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    const { user, accessToken, refreshToken } = response.data;

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Игнорируем ошибку logout
    } finally {
      removeTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateUser = (user: User) => {
    setState((prev) => ({ ...prev, user }));
  };

  // Role helpers
  const isAdmin = state.user?.roles?.includes('admin') ?? false;
  const isAuthor = state.user?.roles?.includes('author') ?? false;
  const isAdminOrAuthor = isAdmin || isAuthor;

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateUser, isAdmin, isAuthor, isAdminOrAuthor }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
