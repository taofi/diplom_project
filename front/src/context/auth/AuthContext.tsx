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
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  removeTokens,
  refreshAccessToken,
} from '@/lib/cookies';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from '@/lib/api-auth';

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
      let token = getAccessToken();

      // Если есть refreshToken, пробуем обновить токены
      if (!token && getRefreshToken()) {
        const newTokens = await refreshAccessToken();
        if (newTokens) {
          setAccessToken(newTokens.accessToken);
          setRefreshToken(newTokens.refreshToken);
          token = newTokens.accessToken;
        }
      }

      if (token) {
        try {
          const user = await getCurrentUser();
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          // Если 401 - пробуем refresh токен
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 401) {
            const newTokens = await refreshAccessToken();
            if (newTokens) {
              setAccessToken(newTokens.accessToken);
              setRefreshToken(newTokens.refreshToken);
              try {
                const user = await getCurrentUser();
                setState({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } catch {
                // Если все равно не удалось - очищаем
              }
            }
          }
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
    const { user, accessToken, refreshToken } = await loginUser(email, password);

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (email: string, password: string, name: string) => {
    const { user, accessToken, refreshToken } = await registerUser(email, password, name);

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
      await logoutUser();
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
