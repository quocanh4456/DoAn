import api from './api';
import type { User } from '@/types';

export const userService = {
  getAll: (search?: string) =>
    api.get<User[]>('/users', { params: { search } }),

  create: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    roleId: number;
  }) => api.post<User>('/users', data),

  update: (id: number, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),

  remove: (id: number) => api.delete(`/users/${id}`),
};
