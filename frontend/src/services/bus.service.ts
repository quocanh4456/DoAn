import api from './api';
import type { Bus } from '@/types';

export const busService = {
  getAll: (search?: string, busType?: string, status?: string) =>
    api.get<Bus[]>('/buses', { params: { search, busType, status } }),

  create: (data: Partial<Bus>) => api.post<Bus>('/buses', data),

  update: (id: number, data: Partial<Bus>) =>
    api.patch<Bus>(`/buses/${id}`, data),

  remove: (id: number) => api.delete(`/buses/${id}`),
};
