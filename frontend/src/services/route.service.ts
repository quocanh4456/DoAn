import api from './api';
import type { Route } from '@/types';

export const routeService = {
  getAll: (search?: string) =>
    api.get<Route[]>('/routes', { params: { search } }),

  getOne: (id: number) => api.get<Route>(`/routes/${id}`),

  create: (data: Partial<Route>) => api.post<Route>('/routes', data),

  update: (id: number, data: Partial<Route>) =>
    api.patch<Route>(`/routes/${id}`, data),

  remove: (id: number) => api.delete(`/routes/${id}`),
};
