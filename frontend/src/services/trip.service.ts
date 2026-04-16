import api from './api';
import type { Trip } from '@/types';

export const tripService = {
  search: (origin?: string, destination?: string, date?: string) =>
    api.get<Trip[]>('/trips/search', {
      params: { origin, destination, date },
    }),

  getAll: () => api.get<Trip[]>('/trips'),

  getOne: (id: number) => api.get<Trip>(`/trips/${id}`),

  create: (data: {
    scheduleId: number;
    busId: number;
    driverName: string;
    departureDate: string;
  }) => api.post<Trip>('/trips', data),

  update: (id: number, data: Partial<Trip>) =>
    api.patch<Trip>(`/trips/${id}`, data),

  remove: (id: number) => api.delete(`/trips/${id}`),
};
