import { create } from 'zustand';

interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

const initialToken = localStorage.getItem('accessToken');
const initialUser = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser ? JSON.parse(initialUser) : null,
  isAuthenticated: !!initialToken && !!initialUser,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      set({ user: JSON.parse(userData), isAuthenticated: true });
    }
  },
}));
