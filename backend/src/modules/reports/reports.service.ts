import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, Ticket, Trip } from '../../entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
  ) {}

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
}
