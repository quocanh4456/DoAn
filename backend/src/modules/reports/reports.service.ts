import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, Ticket, Trip, User } from '../../entities';
import { getPriceMultiplierForDate } from '../../common/utils/pricing.util';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  /** KPI tổng quan — không cần chọn ngày, load ngay khi vào dashboard */
  async getSummary() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayStart = `${todayStr} 00:00:00`;
    const todayEnd   = `${todayStr} 23:59:59`;

    const [totalRevenue, todayRevenue, totalTickets, confirmedTickets,
            pendingTickets, totalCustomers, upcomingTrips] = await Promise.all([
      this.paymentsRepo.createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.status = :s', { s: 'SUCCESS' })
        .getRawOne(),
      this.paymentsRepo.createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.status = :s', { s: 'SUCCESS' })
        .andWhere('p.paid_at BETWEEN :from AND :to', { from: todayStart, to: todayEnd })
        .getRawOne(),
      this.ticketsRepo.count(),
      this.ticketsRepo.count({ where: { status: 'CONFIRMED' } }),
      this.ticketsRepo.count({ where: { status: 'PENDING' } }),
      this.usersRepo.count({ where: { roleId: 3 } }),
      this.tripsRepo.createQueryBuilder('t')
        .where('t.departure_date >= :today', { today: todayStr })
        .andWhere('t.status = :s', { s: 'SCHEDULED' })
        .getCount(),
    ]);

    return {
      totalRevenue:    Number(totalRevenue?.total   || 0),
      todayRevenue:    Number(todayRevenue?.total   || 0),
      totalTickets,
      confirmedTickets,
      pendingTickets,
      totalCustomers,
      upcomingTrips,
    };
  }

  async getRevenue(from: string, to: string) {
    const result = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('DATE(p.paid_at)', 'date')
      .addSelect('SUM(p.amount)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.status = :status', { status: 'SUCCESS' })
      .andWhere('p.paid_at BETWEEN :from AND :to', {
        from: `${from} 00:00:00`,
        to: `${to} 23:59:59`,
      })
      .groupBy('DATE(p.paid_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const totalRevenue = result.reduce(
      (sum, r) => sum + Number(r.total || 0),
      0,
    );

    return { details: result, totalRevenue };
  }

  async getTripStats(from: string, to: string) {
    const trips = await this.tripsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.schedule', 's')
      .leftJoinAndSelect('s.route', 'r')
      .leftJoinAndSelect('t.bus', 'b')
      .leftJoin('t.tickets', 'ticket', 'ticket.status = :ts', {
        ts: 'CONFIRMED',
      })
      .addSelect('COUNT(ticket.id)', 'ticketCount')
      .addSelect('SUM(ticket.seat_count)', 'passengerCount')
      .where('t.departure_date BETWEEN :from AND :to', { from, to })
      .groupBy('t.id')
      .orderBy('t.departure_date', 'DESC')
      .getRawAndEntities();

    const stats = trips.entities.map((trip, i) => ({
      tripId: trip.id,
      departureDate: trip.departureDate,
      route: `${trip.schedule?.route?.origin} → ${trip.schedule?.route?.destination}`,
      departureTime: trip.schedule?.departureTime,
      busType: trip.bus?.busType,
      totalSeats: trip.bus?.totalSeats,
      ticketCount: Number(trips.raw[i]?.ticketCount || 0),
      passengerCount: Number(trips.raw[i]?.passengerCount || 0),
    }));

    return stats;
  }

  async getRouteRevenue(from: string, to: string) {
    const result = await this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoin('p.ticket', 'ticket')
      .leftJoin('ticket.trip', 'trip')
      .leftJoin('trip.schedule', 'schedule')
      .leftJoin('schedule.route', 'route')
      .select('route.origin', 'origin')
      .addSelect('route.destination', 'destination')
      .addSelect('SUM(p.amount)', 'total')
      .addSelect('COUNT(DISTINCT ticket.id)', 'ticketCount')
      .where('p.status = :status', { status: 'SUCCESS' })
      .andWhere('p.paid_at BETWEEN :from AND :to', {
        from: `${from} 00:00:00`,
        to: `${to} 23:59:59`,
      })
      .groupBy('route.id')
      .orderBy('total', 'DESC')
      .getRawMany();

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AI FEATURE 1: Dự báo Doanh thu
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy doanh thu 90 ngày qua, áp dụng Weighted Moving Average + Linear
   * Regression để dự báo `forecastDays` ngày tới.
   */
  async getForecast(forecastDays: number = 14) {
    // Lấy dữ liệu 90 ngày gần nhất
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 89);
    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);

    const raw = await this.paymentsRepo
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.paid_at, '%Y-%m-%d')", 'payment_date')
      .addSelect('SUM(p.amount)', 'total')
      .where('p.status = :status', { status: 'SUCCESS' })
      .andWhere('p.paid_at BETWEEN :from AND :to', {
        from: `${fromStr} 00:00:00`,
        to: `${toStr} 23:59:59`,
      })
      .groupBy("DATE_FORMAT(p.paid_at, '%Y-%m-%d')")
      .orderBy('payment_date', 'ASC')
      .getRawMany();

    // Điền 0 cho những ngày không có giao dịch (fill gaps)
    // DATE_FORMAT trả về chuỗi YYYY-MM-DD trực tiếp từ MySQL
    const revenueMap: Record<string, number> = {};
    raw.forEach((r) => {
      const dateKey = String(r.payment_date).slice(0, 10);
      revenueMap[dateKey] = Number(r.total || 0);
    });

    const historical: { date: string; revenue: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      historical.push({ date: dateStr, revenue: revenueMap[dateStr] ?? 0 });
    }

    // Weighted Moving Average (WMA) với window = 7
    const WINDOW = 7;
    const wmaValues: number[] = historical.map((_, idx) => {
      if (idx < WINDOW - 1) return historical[idx].revenue;
      let weightedSum = 0;
      let totalWeight = 0;
      for (let w = 0; w < WINDOW; w++) {
        const weight = w + 1; // trọng số tăng dần (ngày gần nhất có trọng số cao)
        weightedSum += historical[idx - (WINDOW - 1 - w)].revenue * weight;
        totalWeight += weight;
      }
      return weightedSum / totalWeight;
    });

    // Linear Regression trên WMA để tìm trend (slope)
    const n = wmaValues.length;
    const xMean = (n - 1) / 2;
    const yMean = wmaValues.reduce((s, v) => s + v, 0) / n;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (wmaValues[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const lastWma = wmaValues[wmaValues.length - 1];

    // Tính tốc độ tăng trưởng: so sánh 30 ngày cuối vs 30 ngày trước đó
    const last30 = historical.slice(-30).reduce((s, d) => s + d.revenue, 0);
    const prev30 = historical.slice(-60, -30).reduce((s, d) => s + d.revenue, 0);
    const growthRate = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : 0;

    // Dự báo forecastDays ngày tới
    const forecast: { date: string; revenue: number; isHoliday: boolean }[] = [];
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = futureDate.toISOString().slice(0, 10);

      // Giá trị cơ bản từ Linear Regression
      let predicted = lastWma + slope * i;

      // Áp thêm seasonality từ ngày lễ / cuối tuần
      const seasonMultiplier = getPriceMultiplierForDate(dateStr);
      predicted = Math.max(0, predicted * seasonMultiplier);

      const day = futureDate.getDay();
      const isHoliday = seasonMultiplier > 1.15;

      forecast.push({
        date: dateStr,
        revenue: Math.round(predicted),
        isHoliday: isHoliday || day === 0 || day === 6,
      });
    }

    const forecastTotal = forecast.reduce((s, d) => s + d.revenue, 0);
    const trend: 'up' | 'down' | 'stable' =
      slope > 50000 ? 'up' : slope < -50000 ? 'down' : 'stable';

    return {
      historical: historical.slice(-30), // Chỉ gửi 30 ngày gần nhất lên FE
      forecast,
      trend,
      growthRate: Math.round(growthRate * 10) / 10,
      forecastTotal,
      slope: Math.round(slope),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AI FEATURE 2: Route Insights (phân tích và khuyến nghị theo tuyến)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Phân tích dữ liệu 90 ngày qua theo từng tuyến đường:
   * - Tỷ lệ lấp đầy trung bình
   * - Doanh thu / chuyến
   * - Ngày cao điểm trong tuần
   * - Khuyến nghị: Tăng tần suất / Tăng giá / Kích cầu
   */
  async getRouteInsights() {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 89);
    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);

    // Query trip stats theo tuyến trong 90 ngày
    const tripData = await this.tripsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.schedule', 's')
      .leftJoinAndSelect('s.route', 'r')
      .leftJoinAndSelect('t.bus', 'b')
      .leftJoin('t.tickets', 'ticket', 'ticket.status = :ts', { ts: 'CONFIRMED' })
      .addSelect('COUNT(ticket.id)', 'ticketCount')
      .addSelect('COALESCE(SUM(ticket.seat_count), 0)', 'passengerCount')
      .where('t.departure_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .groupBy('t.id')
      .getRawAndEntities();

    // Query doanh thu theo tuyến
    const revenueData = await this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoin('p.ticket', 'ticket')
      .leftJoin('ticket.trip', 'trip')
      .leftJoin('trip.schedule', 'schedule')
      .leftJoin('schedule.route', 'route')
      .select('route.id', 'routeId')
      .addSelect('route.origin', 'origin')
      .addSelect('route.destination', 'destination')
      .addSelect('SUM(p.amount)', 'totalRevenue')
      .where('p.status = :status', { status: 'SUCCESS' })
      .andWhere('p.paid_at BETWEEN :from AND :to', {
        from: `${fromStr} 00:00:00`,
        to: `${toStr} 23:59:59`,
      })
      .groupBy('route.id')
      .getRawMany();

    const revenueMap: Record<string, number> = {};
    revenueData.forEach((r) => {
      if (r.routeId) revenueMap[r.routeId] = Number(r.totalRevenue || 0);
    });

    // Gom nhóm theo tuyến
    interface RouteAgg {
      routeId: number;
      origin: string;
      destination: string;
      tripCount: number;
      totalPassengers: number;
      totalCapacity: number;
      weekdayCounts: number[];
    }
    const routeMap: Record<number, RouteAgg> = {};

    tripData.entities.forEach((trip, i) => {
      const route = trip.schedule?.route;
      if (!route) return;
      const rid = route.id;
      if (!routeMap[rid]) {
        routeMap[rid] = {
          routeId: rid,
          origin: route.origin,
          destination: route.destination,
          tripCount: 0,
          totalPassengers: 0,
          totalCapacity: 0,
          weekdayCounts: [0, 0, 0, 0, 0, 0, 0],
        };
      }
      const agg = routeMap[rid];
      const passengers = Number(tripData.raw[i]?.passengerCount || 0);
      const capacity = trip.bus?.totalSeats ?? 0;
      const day = new Date(trip.departureDate).getDay();

      agg.tripCount++;
      agg.totalPassengers += passengers;
      agg.totalCapacity += capacity;
      agg.weekdayCounts[day]++;
    });

    const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const insights = Object.values(routeMap).map((agg) => {
      const avgOccupancy =
        agg.totalCapacity > 0
          ? Math.round((agg.totalPassengers / agg.totalCapacity) * 100)
          : 0;
      const totalRevenue = revenueMap[agg.routeId] ?? 0;
      const revenuePerTrip =
        agg.tripCount > 0 ? Math.round(totalRevenue / agg.tripCount) : 0;

      const peakDayIdx = agg.weekdayCounts.indexOf(
        Math.max(...agg.weekdayCounts),
      );
      const peakDay = DAY_NAMES[peakDayIdx];

      // Khuyến nghị AI
      let recommendation: 'increase_frequency' | 'increase_price' | 'boost_demand';
      let recommendationLabel: string;
      let recommendationColor: 'green' | 'orange' | 'red';

      if (avgOccupancy >= 80) {
        recommendation = 'increase_frequency';
        recommendationLabel = 'Nên tăng tần suất chạy';
        recommendationColor = 'green';
      } else if (avgOccupancy >= 60 && revenuePerTrip > 0) {
        recommendation = 'increase_price';
        recommendationLabel = 'Cân nhắc tăng giá';
        recommendationColor = 'orange';
      } else {
        recommendation = 'boost_demand';
        recommendationLabel = 'Cần kích cầu / khuyến mãi';
        recommendationColor = 'red';
      }

      return {
        routeId: agg.routeId,
        route: `${agg.origin} → ${agg.destination}`,
        origin: agg.origin,
        destination: agg.destination,
        tripCount: agg.tripCount,
        avgOccupancy,
        totalRevenue,
        revenuePerTrip,
        peakDay,
        recommendation,
        recommendationLabel,
        recommendationColor,
      };
    });

    // Sắp xếp: tỷ lệ lấp đầy cao nhất lên đầu
    insights.sort((a, b) => b.avgOccupancy - a.avgOccupancy);

    return insights;
  }
}
