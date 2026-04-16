import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Ticket, Trip } from '../../entities';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ConfigService } from '@nestjs/config';

const LOCK_TTL = 600; // 10 minutes in seconds

@Injectable()
export class TicketsService {
  private redis: Redis;

  constructor(
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    private configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.redis.on('error', () => {
      /* Redis connection errors are non-fatal for the app startup */
    });
  }

  async create(dto: CreateTicketDto, userId: number) {
    const trip = await this.tripsRepo.findOne({
      where: { id: dto.tripId },
      relations: ['schedule', 'schedule.route', 'bus'],
    });
    if (!trip) throw new NotFoundException('Không tìm thấy chuyến đi');

    const redisKey = `trip:${trip.id}:available`;
    let currentAvailable: number;

    try {
      const cached = await this.redis.get(redisKey);
      if (cached === null) {
        await this.redis.set(redisKey, trip.availableSeats);
        currentAvailable = trip.availableSeats;
      } else {
        currentAvailable = parseInt(cached, 10);
      }

      if (currentAvailable < dto.seatCount) {
        throw new ConflictException(
          `Chỉ còn ${currentAvailable} chỗ trống. Yêu cầu ${dto.seatCount} chỗ.`,
        );
      }

      const remaining = await this.redis.decrby(redisKey, dto.seatCount);
      if (remaining < 0) {
        await this.redis.incrby(redisKey, dto.seatCount);
        throw new ConflictException('Hết chỗ trống, vui lòng thử lại');
      }
    } catch (e) {
      if (e instanceof ConflictException) throw e;
      // Redis unavailable: fall back to DB-based check
      if (trip.availableSeats < dto.seatCount) {
        throw new ConflictException('Hết chỗ trống');
      }
    }

    const totalPrice = Number(trip.schedule.route.basePrice) * dto.seatCount;

    const ticket = this.ticketsRepo.create({
      tripId: dto.tripId,
      userId,
      seatCount: dto.seatCount,
      pickUpLocation: dto.pickUpLocation,
      dropOffLocation: dto.dropOffLocation,
      totalPrice,
      status: 'PENDING',
    });
    const saved = await this.ticketsRepo.save(ticket);

    try {
      await this.redis.set(
        `lock:ticket:${saved.id}`,
        'locked',
        'EX',
        LOCK_TTL,
      );
    } catch {
      /* non-fatal if Redis is down */
    }

    // Update DB available seats
    await this.tripsRepo.decrement(
      { id: trip.id },
      'availableSeats',
      dto.seatCount,
    );

    return {
      ...saved,
      expiresIn: LOCK_TTL,
      totalPrice,
    };
  }

  async findByUser(userId: number) {
    return this.ticketsRepo.find({
      where: { userId },
      relations: ['trip', 'trip.schedule', 'trip.schedule.route', 'trip.bus'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll() {
    return this.ticketsRepo.find({
      relations: ['trip', 'trip.schedule', 'trip.schedule.route', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(id: number, userId: number) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['trip'],
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');
    if (ticket.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy vé này');
    }
    if (ticket.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy vé đang ở trạng thái chờ');
    }

    ticket.status = 'CANCELLED';
    await this.ticketsRepo.save(ticket);

    // Restore seats
    await this.tripsRepo.increment(
      { id: ticket.tripId },
      'availableSeats',
      ticket.seatCount,
    );

    try {
      const redisKey = `trip:${ticket.tripId}:available`;
      await this.redis.incrby(redisKey, ticket.seatCount);
      await this.redis.del(`lock:ticket:${ticket.id}`);
    } catch {
      /* non-fatal */
    }

    return ticket;
  }

  async confirmPayment(ticketId: number) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');

    ticket.status = 'CONFIRMED';
    await this.ticketsRepo.save(ticket);

    try {
      await this.redis.del(`lock:ticket:${ticket.id}`);
    } catch {
      /* non-fatal */
    }

    return ticket;
  }

  async expireTicket(ticketId: number) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
      relations: ['trip'],
    });
    if (!ticket || ticket.status !== 'PENDING') return;

    ticket.status = 'EXPIRED';
    await this.ticketsRepo.save(ticket);

    await this.tripsRepo.increment(
      { id: ticket.tripId },
      'availableSeats',
      ticket.seatCount,
    );

    try {
      const redisKey = `trip:${ticket.tripId}:available`;
      await this.redis.incrby(redisKey, ticket.seatCount);
    } catch {
      /* non-fatal */
    }
  }
}
