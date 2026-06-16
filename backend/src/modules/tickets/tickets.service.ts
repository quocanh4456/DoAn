import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import Redis from 'ioredis';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Ticket, Trip, User, Payment } from '../../entities';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ConfigService } from '@nestjs/config';
import { calculateDynamicPrice } from '../../common/utils/pricing.util';
import { EmailService } from '../email/email.service';
import { PaymentsService } from '../payments/payments.service';
import { PromotionsService } from '../promotions/promotions.service';

const LOCK_TTL = 600; // 10 minutes in seconds
const GUEST_LOCK_TTL = 1800; // 30 minutes for guest bookings

@Injectable()
export class TicketsService {
  private redis: Redis;

  constructor(
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    private configService: ConfigService,
    private emailService: EmailService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    private promotionsService: PromotionsService,
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

    const totalSeats = trip.bus?.totalSeats ?? 0;
    const dynamicPricing = calculateDynamicPrice(
      Number(trip.schedule.route.basePrice),
      trip.departureDate,
      trip.availableSeats,
      totalSeats,
      trip.discountPercent || 0,
    );
    let totalPrice = dynamicPricing.finalPrice * dto.seatCount;

    // Áp dụng mã khuyến mãi (nếu có)
    let promoCode: string | null = null;
    let discountAmount = 0;
    if (dto.promoCode) {
      const promoResult = await this.promotionsService.validate(dto.promoCode, totalPrice);
      promoCode = promoResult.code;
      discountAmount = promoResult.discountAmount;
      totalPrice = totalPrice - discountAmount;
    }

    const isGuestBooking = !!dto.guestEmail;
    const lockTtl = isGuestBooking ? GUEST_LOCK_TTL : LOCK_TTL;

    const ticket = this.ticketsRepo.create({
      tripId: dto.tripId,
      userId,
      seatCount: dto.seatCount,
      pickUpLocation: dto.pickUpLocation,
      dropOffLocation: dto.dropOffLocation,
      totalPrice,
      promoCode,
      discountAmount,
      status: 'PENDING',
      guestName: dto.guestName || null,
      guestPhone: dto.guestPhone || null,
      guestEmail: dto.guestEmail || null,
    });
    const saved = await this.ticketsRepo.save(ticket);

    try {
      await this.redis.set(
        `lock:ticket:${saved.id}`,
        'locked',
        'EX',
        lockTtl,
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

    // If guest booking with email → send email with payment link
    if (isGuestBooking) {
      this.sendGuestPaymentEmail(saved, trip).catch(() => {});
    }

    // Tăng lượt sử dụng mã KM
    if (promoCode) {
      this.promotionsService.incrementUsage(promoCode).catch(() => {});
    }

    return {
      ...saved,
      expiresIn: lockTtl,
      totalPrice,
      discountAmount,
    };
  }

  async findByUser(userId: number) {
    // Auto-expire old PENDING tickets before returning
    await this.expireOldPendingTickets();

    return this.ticketsRepo.find({
      where: { userId },
      relations: ['trip', 'trip.schedule', 'trip.schedule.route', 'trip.bus'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(search?: string) {
    const qb = this.ticketsRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.trip', 'trip')
      .leftJoinAndSelect('trip.schedule', 'schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('ticket.user', 'user')
      .orderBy('ticket.createdAt', 'DESC');

    if (search) {
      if (!isNaN(Number(search))) {
        // Search by ticket id or phone
        qb.where('ticket.id = :id OR user.phone LIKE :phone', { id: Number(search), phone: `%${search}%` });
      } else {
        // Search by user name or status
        qb.where('user.fullName LIKE :name OR ticket.status = :status', { name: `%${search}%`, status: search });
      }
    }

    return qb.getMany();
  }

  async confirmCashPayment(id: number, staffId: number) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['trip', 'trip.schedule', 'trip.schedule.route', 'trip.bus', 'user'],
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');
    if (ticket.status !== 'PENDING') throw new BadRequestException('Vé không ở trạng thái chờ thanh toán');

    ticket.status = 'CONFIRMED';
    await this.ticketsRepo.save(ticket);

    // Create cash payment record
    const payment = this.paymentsRepo.create({
      ticketId: ticket.id,
      amount: ticket.totalPrice,
      paymentMethod: 'CASH',
      status: 'SUCCESS',
      paidAt: new Date(),
      description: `Thu tiền mặt tại quầy (Nhân viên ID: ${staffId})`,
    });
    await this.paymentsRepo.save(payment);

    try {
      await this.redis.del(`lock:ticket:${ticket.id}`);
    } catch {
      /* non-fatal */
    }

    // Send confirmation email
    if (ticket.user) {
      this.emailService.sendTicketConfirmation(ticket, ticket.user).catch(() => {});
    }

    return ticket;
  }

  async cancel(id: number, user: any, reason?: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['trip', 'trip.schedule'],
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');
    
    const isAdminOrStaff = user.role?.name === 'Admin' || user.role?.name === 'Staff';
    if (ticket.userId !== user.id && !isAdminOrStaff) {
      throw new BadRequestException('Bạn không có quyền hủy vé này');
    }
    if (ticket.status !== 'PENDING' && ticket.status !== 'CONFIRMED') {
      throw new BadRequestException('Chỉ có thể hủy vé đang ở trạng thái chờ hoặc đã thanh toán');
    }

    if (ticket.trip && ticket.trip.schedule) {
      const departureDate = new Date(ticket.trip.departureDate);
      if (ticket.trip.schedule.departureTime) {
        const [hours, minutes] = ticket.trip.schedule.departureTime.split(':').map(Number);
        departureDate.setHours(hours, minutes, 0, 0);
      }
      
      const now = new Date();
      // Không cho phép hủy nếu thời gian hiện tại đã quá giờ xe chạy hoặc còn cách giờ chạy ít hơn 2 tiếng
      const limitTime = new Date(departureDate.getTime() - 2 * 60 * 60 * 1000);
      
      if (now >= limitTime) {
        throw new BadRequestException('Không thể hủy vé vì chuyến xe đã xuất bến hoặc đã qua thời gian cho phép hủy (sát giờ khởi hành).');
      }
    }

    ticket.status = 'CANCELLED';
    if (reason) {
      ticket.cancelReason = reason;
    }
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
      relations: ['trip', 'trip.schedule', 'trip.schedule.route', 'trip.bus'],
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');

    ticket.status = 'CONFIRMED';
    await this.ticketsRepo.save(ticket);

    try {
      await this.redis.del(`lock:ticket:${ticket.id}`);
    } catch {
      /* non-fatal */
    }

    // Send confirmation email (fire-and-forget, non-blocking)
    this.usersRepo.findOne({ where: { id: ticket.userId } }).then((user) => {
      if (user) {
        this.emailService.sendTicketConfirmation(ticket, user).catch(() => {});
      }
    });

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

  /**
   * Auto-expire PENDING tickets older than 10 minutes.
   * Runs every minute via cron and also on-demand when user views their tickets.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOldPendingTickets() {
    const cutoff = new Date(Date.now() - LOCK_TTL * 1000);
    const staleTickets = await this.ticketsRepo.find({
      where: {
        status: 'PENDING',
        createdAt: LessThan(cutoff),
      },
      relations: ['trip'],
    });

    for (const ticket of staleTickets) {
      await this.expireTicket(ticket.id);
    }
  }

  /**
   * Get ticket info for guest payment page.
   * Validates guest email to prevent unauthorized access.
   */
  async getGuestTicket(ticketId: number, email: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
      relations: ['trip', 'trip.schedule', 'trip.schedule.route', 'trip.bus'],
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');
    if (!ticket.guestEmail || ticket.guestEmail !== email) {
      throw new BadRequestException('Email không khớp với thông tin vé');
    }
    return ticket;
  }

  /**
   * Create PayOS link and send email to guest.
   * Fire-and-forget, non-blocking.
   */
  private async sendGuestPaymentEmail(ticket: Ticket, trip: Trip) {
    try {
      // Build guest payment page URL
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const paymentPageUrl = `${frontendUrl}/guest-payment/${ticket.id}?email=${encodeURIComponent(ticket.guestEmail!)}`;

      await this.emailService.sendGuestBookingEmail(
        ticket,
        trip,
        ticket.guestName || 'Khách hàng',
        ticket.guestEmail!,
        paymentPageUrl,
      );
    } catch (err) {
      // Non-fatal: log but don't throw
      console.error('Failed to send guest payment email:', err);
    }
  }
}
