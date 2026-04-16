import api from './api';
import type { AuthResponse } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  getProfile: () => api.get('/auth/profile'),
};
