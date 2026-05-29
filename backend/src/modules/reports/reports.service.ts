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

  async getStaffShiftReport(staffId: number) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayStart = `${todayStr} 00:00:00`;
    const todayEnd = `${todayStr} 23:59:59`;

    // Lấy các vé do nhân viên này bán trong ngày hôm nay (dựa vào ticket.user_id = staffId nếu mua tại quầy)
    // Và các vé có payment method = 'CASH' (thu tiền mặt trực tiếp)
    const tickets = await this.ticketsRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.trip', 'trip')
      .leftJoinAndSelect('trip.schedule', 'schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .leftJoinAndSelect('ticket.user', 'user')
      .innerJoin('ticket.payments', 'payment')
      .where('payment.paymentMethod = :method', { method: 'CASH' })
      .andWhere('payment.status = :status', { status: 'SUCCESS' })
      .andWhere('payment.paidAt BETWEEN :from AND :to', { from: todayStart, to: todayEnd })
      // Cần chắc chắn rằng staffId thu tiền (với description chứa ID của staff)
      .andWhere('payment.description LIKE :desc', { desc: `%Nhân viên ID: ${staffId}%` })
      .orderBy('payment.paidAt', 'DESC')
      .getMany();

    const totalRevenue = tickets.reduce((sum, ticket) => sum + Number(ticket.totalPrice), 0);
    
    return {
      tickets,
      totalTickets: tickets.length,
      totalRevenue,
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
    // ── Bước 1: Lấy trip IDs có vé CONFIRMED được đặt trong kỳ báo cáo ──
    // (dùng JOIN thay OR EXISTS cho hiệu năng tốt hơn)
    const tripIdsWithActivity = await this.ticketsRepo
      .createQueryBuilder('tk')
      .select('DISTINCT tk.trip_id', 'tripId')
      .where("tk.status = 'CONFIRMED'")
      .andWhere('tk.created_at BETWEEN :fromTs AND :toTs', {
        fromTs: `${from} 00:00:00`,
        toTs: `${to} 23:59:59`,
      })
      .getRawMany();

    const activityTripIds = tripIdsWithActivity.map((r) => Number(r.tripId));

    // ── Bước 2: Lấy thống kê chuyến xe ──
    // Điều kiện: ngày khởi hành nằm trong kỳ HOẶC có vé đặt trong kỳ
    const qb = this.tripsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.schedule', 's')
      .leftJoinAndSelect('s.route', 'r')
      .leftJoinAndSelect('t.bus', 'b')
      .leftJoin(
        't.tickets',
        'ticket',
        "ticket.status = 'CONFIRMED'",
      )
      .addSelect('COUNT(ticket.id)', 'ticketCount')
      .addSelect('COALESCE(SUM(ticket.seatCount), 0)', 'passengerCount')
      .groupBy('t.id')
      .orderBy('t.departure_date', 'DESC');

    if (activityTripIds.length > 0) {
      qb.where(
        't.departure_date BETWEEN :from AND :to OR t.id IN (:...ids)',
        { from, to, ids: activityTripIds },
      );
    } else {
      qb.where('t.departure_date BETWEEN :from AND :to', { from, to });
    }

    const trips = await qb.getRawAndEntities();

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

  // ─────────────────────────────────────────────────────────────────────────────
  // AI FEATURE 3: Phân tích khách hàng RFM (Recency · Frequency · Monetary)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Phân loại từng khách hàng theo 3 chỉ số RFM:
   * R – Recency: ngày đặt vé cuối cách đây bao lâu
   * F – Frequency: số lần đặt vé thành công (CONFIRMED)
   * M – Monetary: tổng số tiền đã thanh toán (SUCCESS)
   * → Gán nhãn: VIP / Trung thành / Tiềm năng / Cần kích cầu
   */
  async getRfmSegments() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Query tổng hợp theo từng user
    // Fix: GROUP BY phải bao gồm các cột non-aggregate (MySQL ONLY_FULL_GROUP_BY)
    const raw = await this.ticketsRepo
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .leftJoin('t.payments', 'p', 'p.status = :ps', { ps: 'SUCCESS' })
      .select('u.id', 'userId')
      .addSelect('MIN(u.fullName)', 'fullName')
      .addSelect('MIN(u.email)', 'email')
      .addSelect('MIN(u.phone)', 'phone')
      .addSelect("DATE_FORMAT(MAX(t.created_at), '%Y-%m-%d')", 'lastBookingDate')
      .addSelect(
        "COUNT(DISTINCT CASE WHEN t.status = 'CONFIRMED' THEN t.id END)",
        'frequency',
      )
      .addSelect('COALESCE(SUM(p.amount), 0)', 'monetary')
      .where('u.id IS NOT NULL')
      .groupBy('u.id')
      .orderBy('monetary', 'DESC')
      .getRawMany();

    const todayMs = new Date(todayStr).getTime();

    const segments = raw.map((r) => {
      const lastDate = String(r.lastBookingDate).slice(0, 10);
      const recencyDays = Math.floor(
        (todayMs - new Date(lastDate).getTime()) / 86_400_000,
      );
      const frequency = Number(r.frequency || 0);
      const monetary = Number(r.monetary || 0);

      // Scoring 1–3 cho mỗi chiều
      const rScore = recencyDays <= 7 ? 3 : recencyDays <= 30 ? 2 : 1;
      const fScore = frequency >= 5 ? 3 : frequency >= 2 ? 2 : 1;
      const mScore = monetary >= 2_000_000 ? 3 : monetary >= 500_000 ? 2 : 1;
      const total = rScore + fScore + mScore;

      // Gán nhãn
      let segment: string;
      let segmentColor: 'gold' | 'blue' | 'green' | 'red';
      let segmentIcon: string;
      if (total >= 8) {
        segment = 'VIP';
        segmentColor = 'gold';
        segmentIcon = '🏆';
      } else if (total >= 6) {
        segment = 'Trung thành';
        segmentColor = 'blue';
        segmentIcon = '💙';
      } else if (total >= 4) {
        segment = 'Tiềm năng';
        segmentColor = 'green';
        segmentIcon = '💛';
      } else {
        segment = 'Cần kích cầu';
        segmentColor = 'red';
        segmentIcon = '🔴';
      }

      return {
        userId: Number(r.userId),
        name: r.fullName ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
        recencyDays,
        frequency,
        monetary,
        rScore,
        fScore,
        mScore,
        totalScore: total,
        segment,
        segmentColor,
        segmentIcon,
      };
    });

    // Tổng hợp theo phân khúc cho biểu đồ tròn
    const summary = {
      vip: segments.filter((s) => s.segment === 'VIP').length,
      loyal: segments.filter((s) => s.segment === 'Trung thành').length,
      potential: segments.filter((s) => s.segment === 'Tiềm năng').length,
      needBoost: segments.filter((s) => s.segment === 'Cần kích cầu').length,
    };

    return { segments, summary };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AI FEATURE 4: Cảnh báo chuyến ít khách & Gợi ý khuyến mãi
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Quét các chuyến sắp khởi hành (2–14 ngày tới):
   * - So sánh tỷ lệ lấp đầy hiện tại với trung bình lịch sử cùng tuyến (90 ngày)
   * - Nếu < 60% kỳ vọng → cảnh báo LOW DEMAND
   * - Đề xuất % giảm giá phù hợp
   */
  async getLowDemandAlerts() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Ngày từ ngày mai đến 14 ngày tới
    const fromFuture = new Date(today);
    fromFuture.setDate(today.getDate() + 1);
    const toFuture = new Date(today);
    toFuture.setDate(today.getDate() + 14);
    const fromFutureStr = fromFuture.toISOString().slice(0, 10);
    const toFutureStr = toFuture.toISOString().slice(0, 10);

    // Lấy tỷ lệ lấp đầy lịch sử 90 ngày theo từng tuyến
    const fromPast = new Date(today);
    fromPast.setDate(today.getDate() - 89);
    const fromPastStr = fromPast.toISOString().slice(0, 10);

    const historicalRaw = await this.tripsRepo
      .createQueryBuilder('t')
      .leftJoin('t.schedule', 's')
      .leftJoin('s.route', 'r')
      .leftJoin('t.bus', 'b')
      .leftJoin('t.tickets', 'ticket', 'ticket.status = :ts', { ts: 'CONFIRMED' })
      .select('r.id', 'routeId')
      .addSelect('COALESCE(SUM(ticket.seatCount), 0)', 'totalPassengers')
      .addSelect('COALESCE(SUM(b.totalSeats), 0)', 'totalCapacity')
      .where('t.departure_date BETWEEN :from AND :to', {
        from: fromPastStr,
        to: todayStr,
      })
      .groupBy('r.id')
      .getRawMany();

    // Tính avgOccupancy theo tuyến
    const avgOccMap: Record<number, number> = {};
    historicalRaw.forEach((r) => {
      const cap = Number(r.totalCapacity || 0);
      const pax = Number(r.totalPassengers || 0);
      avgOccMap[Number(r.routeId)] = cap > 0 ? Math.round((pax / cap) * 100) : 0;
    });

    // Lấy các chuyến sắp tới với số ghế hiện tại
    const upcomingTrips = await this.tripsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.schedule', 's')
      .leftJoinAndSelect('s.route', 'r')
      .leftJoinAndSelect('t.bus', 'b')
      .where('t.departure_date BETWEEN :from AND :to', {
        from: fromFutureStr,
        to: toFutureStr,
      })
      .orderBy('t.departure_date', 'ASC')
      .getMany();

    const alerts = upcomingTrips
      .map((trip) => {
        const route = trip.schedule?.route;
        if (!route) return null;

        const totalSeats = trip.bus?.totalSeats ?? 0;
        const availableSeats = trip.availableSeats ?? totalSeats;
        const bookedSeats = totalSeats - availableSeats;
        const currentOccupancy =
          totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

        const expectedOccupancy = avgOccMap[route.id] ?? -1;

        // Chỉ cảnh báo nếu:
        // (A) Có historical data VÀ đang thấp hơn 60% kỳ vọng
        // (B) Không có historical data NHƯNG chuyến trong 3 ngày tới VÀ 0 đặt chỗ
        const daysUntilDeparture = Math.floor(
          (new Date(trip.departureDate).getTime() - today.getTime()) / 86_400_000,
        );

        if (expectedOccupancy >= 0) {
          // Case A: có historical data
          const threshold = expectedOccupancy * 0.6;
          if (currentOccupancy >= threshold) return null; // đủ tốt, không cảnh báo
        } else {
          // Case B: không có historical data — chỉ alert nếu sắp khởi hành và 0 booking
          if (daysUntilDeparture > 3 || currentOccupancy > 0) return null;
        }

        // Tính % đề xuất giảm giá (tối đa 25%)
        let suggestedDiscount = 0;
        if (expectedOccupancy > 0) {
          suggestedDiscount = Math.min(
            25,
            Math.round((1 - currentOccupancy / Math.max(expectedOccupancy, 1)) * 20),
          );
        } else {
          // Không có historical data nhưng sắp khởi hành → gợi ý giảm cố định
          suggestedDiscount = 10;
        }

        // Mức độ nghiêm trọng
        const severity: 'high' | 'medium' | 'low' =
          currentOccupancy < 15 ? 'high' : currentOccupancy < 30 ? 'medium' : 'low';

        return {
          tripId: trip.id,
          route: `${route.origin} → ${route.destination}`,
          origin: route.origin,
          destination: route.destination,
          departureDate: trip.departureDate,
          departureTime: trip.schedule?.departureTime ?? '',
          totalSeats,
          bookedSeats,
          availableSeats,
          currentOccupancy,
          expectedOccupancy: Math.max(0, expectedOccupancy), // normalize -1 → 0 trong response
          suggestedDiscount,
          severity,
          basePrice: Number(route.basePrice || 0),
          discountedPrice: Math.round(
            Number(route.basePrice || 0) * (1 - suggestedDiscount / 100) / 1000,
          ) * 1000,
        };
      })
      .filter(Boolean);

    return alerts;
  }
}
