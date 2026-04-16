import api from './api';
import type { Schedule } from '@/types';

export const scheduleService = {
  getAll: (routeId?: number) =>
    api.get<Schedule[]>('/schedules', { params: { routeId } }),

  create: (data: { routeId: number; departureTime: string }) =>
    api.post<Schedule>('/schedules', data),

  update: (id: number, data: Partial<Schedule>) =>
    api.patch<Schedule>(`/schedules/${id}`, data),

  remove: (id: number) => api.delete(`/schedules/${id}`),
};
