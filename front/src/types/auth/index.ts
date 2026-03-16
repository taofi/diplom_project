/**
 * Auth Types
 * Типы для аутентификации и пользователей
 */

import type { EntityBase, Timestamped } from '../base';

// =======================
// USER TYPES
// =======================

/**
 * Пользователь
 */
export interface User extends EntityBase, Timestamped {
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  locale: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// =======================
// AUTH RESPONSE TYPES
// =======================

/**
 * Ответ аутентификации
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// =======================
// LOGIN/REGISTER DTO
// =======================

/**
 * DTO для входа
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * DTO для регистрации
 */
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

// =======================
// STATE TYPES
// =======================

/**
 * Состояние авторизации
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
