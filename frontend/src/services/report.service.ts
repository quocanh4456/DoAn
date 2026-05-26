import api from './api';
import type { RevenueData, TripStat } from '@/types';

export interface ForecastDay {
  date: string;
  revenue: number;
  isHoliday: boolean;
}

export interface ForecastResult {
  historical: { date: string; revenue: number }[];
  forecast: ForecastDay[];
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  forecastTotal: number;
  slope: number;
}

export interface RouteInsight {
  routeId: number;
  route: string;
  origin: string;
  destination: string;
  tripCount: number;
  avgOccupancy: number;
  totalRevenue: number;
  revenuePerTrip: number;
  peakDay: string;
  recommendation: 'increase_frequency' | 'increase_price' | 'boost_demand';
  recommendationLabel: string;
  recommendationColor: 'green' | 'orange' | 'red';
}

export interface RfmCustomer {
  userId: number;
  name: string;
  email: string;
  phone: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  totalScore: number;
  segment: string;
  segmentColor: 'gold' | 'blue' | 'green' | 'red';
  segmentIcon: string;
}

export interface RfmResult {
  segments: RfmCustomer[];
  summary: {
    vip: number;
    loyal: number;
    potential: number;
    needBoost: number;
  };
}

export interface LowDemandAlert {
  tripId: number;
  route: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  currentOccupancy: number;
  expectedOccupancy: number;
  suggestedDiscount: number;
  severity: 'high' | 'medium' | 'low';
  basePrice: number;
  discountedPrice: number;
}

export const reportService = {
  getSummary: () =>
    api.get<{
      totalRevenue: number;
      todayRevenue: number;
      totalTickets: number;
      confirmedTickets: number;
      pendingTickets: number;
      totalCustomers: number;
      upcomingTrips: number;
    }>('/reports/summary'),

  getRevenue: (from: string, to: string) =>
    api.get<{ details: RevenueData[]; totalRevenue: number }>(
      '/reports/revenue',
      { params: { from, to } },
    ),

  getTripStats: (from: string, to: string) =>
    api.get<TripStat[]>('/reports/trips', { params: { from, to } }),

  getRouteRevenue: (from: string, to: string) =>
    api.get('/reports/route-revenue', { params: { from, to } }),

  /** AI: Dự báo doanh thu N ngày tới */
  getForecast: (days: number = 14) =>
    api.get<ForecastResult>('/reports/forecast', { params: { days } }),

  /** AI: Phân tích và khuyến nghị tuyến đường */
  getRouteInsights: () =>
    api.get<RouteInsight[]>('/reports/route-insights'),

  /** AI: Phân khúc khách hàng RFM */
  getRfmSegments: () =>
    api.get<RfmResult>('/reports/rfm-segments'),

  /** AI: Cảnh báo chuyến ít khách */
  getLowDemandAlerts: () =>
    api.get<LowDemandAlert[]>('/reports/low-demand-alerts'),
};
