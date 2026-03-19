export interface User {
  id: number;
  email: string;
  name: string;
  roles: ('admin' | 'author' | 'user')[];
  locale: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
