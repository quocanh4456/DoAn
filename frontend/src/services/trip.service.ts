import api from './api';
import type { Trip } from '@/types';

export interface PriceFactor {
  label: string;
  multiplier: number;
  active: boolean;
}

export interface DynamicPrice {
  tripId: number;
  departureDate: string;
  route: string;
  availableSeats: number;
  totalSeats: number;
  basePrice: number;
  finalPrice: number;
  totalMultiplier: number;
  factors: PriceFactor[];
}

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

  remove: (id: number, cancelReason: string) =>
    api.delete(`/trips/${id}`, { data: { cancelReason } }),

  /** AI: Lấy giá vé động cho một chuyến xe */
  getDynamicPrice: (id: number) =>
    api.get<DynamicPrice>(`/trips/${id}/dynamic-price`),
};
