import api from './api';
import type { RevenueData, TripStat } from '@/types';

export const reportService = {
  getRevenue: (from: string, to: string) =>
    api.get<{ details: RevenueData[]; totalRevenue: number }>(
      '/reports/revenue',
      { params: { from, to } },
    ),

  getTripStats: (from: string, to: string) =>
    api.get<TripStat[]>('/reports/trips', { params: { from, to } }),

  getRouteRevenue: (from: string, to: string) =>
    api.get('/reports/route-revenue', { params: { from, to } }),
};
