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

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { oldPassword, newPassword }),

  getMyProfile: () =>
    api.get<{
      id: number;
      fullName: string;
      email: string;
      phone: string;
      isActive: boolean;
      createdAt: string;
      role: { id: number; name: string };
    }>('/auth/me'),

  updateMyProfile: (data: { fullName: string; phone: string }) =>
    api.patch<{ message: string; fullName: string; phone: string }>('/auth/me', data),
};
