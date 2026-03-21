'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { User, AuthState } from './types';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  removeTokens,
  refreshAccessToken,
  setUserData,
  getUserData,
  removeUserData,
} from '@/lib/cookies';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from '@/lib/api-auth';
import api from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  updateLocale: (locale: string) => Promise<void>;
  isAdmin: boolean;
  isAuthor: boolean;
  isAdminOrAuthor: boolean;
}

// Вспомогательная функция для проверки валидности данных пользователя
function isValidUser(user: unknown): user is User {
  if (!user || typeof user !== 'object') return false;
  const u = user as Record<string, unknown>;
  return typeof u.id === 'number' && typeof u.email === 'string' && typeof u.name === 'string';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Начальное состояние - неавторизованный, пока не загрузимся
  // Это гарантирует одинаковый рендер на сервере и клиенте (избегаем hydration error)
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Сначала читаем данные из куки для мгновенного отображения
    // useEffect выполняется только на клиенте, поэтому проблем с гидратацией нет
    const cachedUser = getUserData();
    const cachedToken = getAccessToken();
    
    // Если есть данные в куки - показываем их сразу
    if (cachedUser && cachedToken) {
      setState({
        user: cachedUser,
        isAuthenticated: true,
        isLoading: true, // Но продолжаем проверку на сервере
      });
    }
    
    const initAuth = async () => {
      let token = getAccessToken();

      // Если нет токена, но есть refreshToken - пробуем обновить
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
          // Пытаемся получить данные пользователя с сервера для проверки токена
          const user = await getCurrentUser();
          
          // Проверяем, что получили валидные данные пользователя
          if (!isValidUser(user)) {
            console.warn('[AuthContext] Invalid user data received:', user);
            removeTokens();
            removeUserData();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }
          
          // Обновляем данные пользователя в куки (на случай изменения на сервере)
          setUserData(user);
          
          // Синхронизируем локаль из БД в куки (если куки пустые)
          syncLocaleFromDb(user.locale);
          
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
                if (!isValidUser(user)) {
                  removeTokens();
                  removeUserData();
                  setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                  });
                  return;
                }
                setUserData(user);
                
                // Синхронизируем локаль из БД в куки (если куки пустые)
                syncLocaleFromDb(user.locale);
                
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
          // Токен недействителен - очищаем, но сохраняем данные из куки как резерв
          // (показываем UI, но помечаем как не верифицированный)
          removeTokens();
          removeUserData();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        // Нет тока - очищаем и куки пользователя
        removeUserData();
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user, accessToken, refreshToken } = await loginUser(email, password);

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUserData(user); // Сохраняем данные пользователя в куки

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
    setUserData(user); // Сохраняем данные пользователя в куки

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
      removeUserData(); // Удаляем данные пользователя из куки
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

  const updateLocale = async (locale: string) => {
    if (!state.user) return;
    
    try {
      // Используем эндпоинт для обновления локали пользователя
      const response = await api.patch(`/users/${state.user.id}/locale`, { locale });
      const updatedUser = response.data;
      
      // Обновляем данные пользователя в state и куки
      setUserData(updatedUser);
      setState((prev) => ({ ...prev, user: updatedUser }));
    } catch (error) {
      console.error('Failed to update locale:', error);
      throw error;
    }
  };

  // Синхронизировать локаль из БД в куки при первом входе (если куки пустые)
  const syncLocaleFromDb = (localeFromDb: string | null | undefined) => {
    if (!localeFromDb) return;
    
    // Проверяем, есть ли уже локаль в куках
    const currentCookieLocale = Cookies.get('locale');
    
    // Если куки пустые - записываем локаль из БД
    if (!currentCookieLocale) {
      Cookies.set('locale', localeFromDb, {
        path: '/',
        sameSite: 'strict',
        expires: 365,
      });
    }
  };

  // Role helpers - с защитой от undefined
  const isAdmin = Array.isArray(state.user?.roles) && state.user.roles.includes('admin');
  const isAuthor = Array.isArray(state.user?.roles) && state.user.roles.includes('author');
  const isAdminOrAuthor = isAdmin || isAuthor;

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateUser, updateLocale, isAdmin, isAuthor, isAdminOrAuthor }}
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
