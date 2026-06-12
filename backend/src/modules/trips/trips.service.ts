import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Trip, Bus, Schedule } from '../../entities';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { calculateTripBasePrice, calculateDynamicPrice } from '../../common/utils/pricing.util';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    @InjectRepository(Bus) private busesRepo: Repository<Bus>,
    @InjectRepository(Schedule) private schedulesRepo: Repository<Schedule>,
  ) {}

  /**
   * Kiểm tra xung đột xe và tài xế.
   * Cùng ngày + cùng khung giờ (departureTime) = xung đột.
   * @param excludeTripId - ID chuyến đi cần loại trừ (dùng khi update)
   */
  private async checkConflicts(
    scheduleId: number,
    busId: number,
    driverName: string,
    departureDate: string,
    excludeTripId?: number,
  ) {
    // Lấy thông tin schedule để biết departureTime
    const schedule = await this.schedulesRepo.findOne({
      where: { id: scheduleId },
      relations: ['route'],
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy khung giờ');

    const departureTime = schedule.departureTime;

    // --- Kiểm tra xung đột phương tiện ---
    const busConflictQb = this.tripsRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.schedule', 'schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .where('trip.busId = :busId', { busId })
      .andWhere('trip.departureDate = :departureDate', { departureDate })
      .andWhere('schedule.departureTime = :departureTime', { departureTime })
      .andWhere('trip.status != :cancelled', { cancelled: 'CANCELLED' });

    if (excludeTripId) {
      busConflictQb.andWhere('trip.id != :excludeId', { excludeId: excludeTripId });
    }

    const busConflict = await busConflictQb.getOne();
    if (busConflict) {
      const bus = await this.busesRepo.findOne({ where: { id: busId } });
      const routeName = busConflict.schedule?.route
        ? `${busConflict.schedule.route.origin} → ${busConflict.schedule.route.destination}`
        : `tuyến #${busConflict.schedule?.routeId}`;
      throw new ConflictException(
        `Xe ${bus?.licensePlate || busId} đang chạy tuyến ${routeName} lúc ${departureTime}. Vui lòng điều động xe khác!`,
      );
    }

    // --- Kiểm tra xung đột tài xế ---
    const driverConflictQb = this.tripsRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.schedule', 'schedule')
      .where('trip.driverName = :driverName', { driverName })
      .andWhere('trip.departureDate = :departureDate', { departureDate })
      .andWhere('schedule.departureTime = :departureTime', { departureTime })
      .andWhere('trip.status != :cancelled', { cancelled: 'CANCELLED' });

    if (excludeTripId) {
      driverConflictQb.andWhere('trip.id != :excludeId', { excludeId: excludeTripId });
    }

    const driverConflict = await driverConflictQb.getOne();
    if (driverConflict) {
      throw new ConflictException(
        `Tài xế ${driverName} đang được phân công chạy chuyến khác lúc ${departureTime}. Vui lòng chọn tài xế khác!`,
      );
    }
  }

  async search(origin?: string, destination?: string, date?: string) {
    const qb = this.tripsRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.schedule', 'schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .leftJoinAndSelect('trip.bus', 'bus')
      .where('trip.status = :status', { status: 'SCHEDULED' })
      // Only show upcoming trips for customer search.
      .andWhere(
        '(trip.departureDate > CURDATE() OR (trip.departureDate = CURDATE() AND schedule.departureTime >= CURTIME()))',
      );

    if (origin) {
      qb.andWhere('route.origin LIKE :origin', { origin: `%${origin}%` });
    }
    if (destination) {
      qb.andWhere('route.destination LIKE :dest', { dest: `%${destination}%` });
    }
    if (date) {
      qb.andWhere('trip.departureDate = :date', { date });
    }

    qb.andWhere('trip.availableSeats > 0');
    qb.orderBy('schedule.departureTime', 'ASC');

    const trips = await qb.getMany();

    return trips.map((trip) => {
      if (trip.schedule?.route?.basePrice != null) {
        let adjustedPrice = calculateTripBasePrice(
          Number(trip.schedule.route.basePrice),
          trip.departureDate,
        );
        // Áp dụng giảm giá nếu có
        if (trip.discountPercent > 0) {
          adjustedPrice = Math.round(adjustedPrice * (100 - trip.discountPercent) / 100 / 1000) * 1000;
        }
        trip.schedule.route.basePrice = adjustedPrice;
      }
      return trip;
    });
  }

  async findAll() {
    return this.tripsRepo.find({
      relations: ['schedule', 'schedule.route', 'bus'],
      order: { departureDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const trip = await this.tripsRepo.findOne({
      where: { id },
      relations: ['schedule', 'schedule.route', 'bus'],
    });
    if (!trip) throw new NotFoundException('Không tìm thấy chuyến đi');
    return trip;
  }

  private async resolveScheduleId(dto: { scheduleId?: number, routeId?: number, departureTime?: string }): Promise<number> {
    if (dto.scheduleId) {
      return dto.scheduleId;
    }
    if (!dto.routeId || !dto.departureTime) {
      throw new BadRequestException('Phải cung cấp scheduleId hoặc cả routeId và departureTime');
    }
    const existing = await this.schedulesRepo.findOne({
      where: { routeId: dto.routeId, departureTime: dto.departureTime }
    });
    if (existing) {
      return existing.id;
    }
    const newSchedule = this.schedulesRepo.create({
      routeId: dto.routeId,
      departureTime: dto.departureTime,
      isActive: true,
    });
    const saved = await this.schedulesRepo.save(newSchedule);
    return saved.id;
  }

  async create(dto: CreateTripDto) {
    const bus = await this.busesRepo.findOne({ where: { id: dto.busId } });
    if (!bus) throw new NotFoundException('Không tìm thấy phương tiện');

    const scheduleId = await this.resolveScheduleId(dto);

    // Kiểm tra xung đột xe và tài xế
    await this.checkConflicts(scheduleId, dto.busId, dto.driverName, dto.departureDate);

    const { routeId, departureTime, ...tripData } = dto;
    const trip = this.tripsRepo.create({
      ...tripData,
      scheduleId,
      availableSeats: bus.totalSeats,
    });
    return this.tripsRepo.save(trip);
  }

  async update(id: number, dto: UpdateTripDto) {
    const trip = await this.findOne(id);

    if (dto.status) {
      if (trip.status === 'CANCELLED' && dto.status !== 'CANCELLED') {
        throw new BadRequestException('Không thể thay đổi trạng thái của chuyến đi đã hủy');
      }
      if (trip.status === 'COMPLETED' && dto.status !== 'COMPLETED') {
        throw new BadRequestException('Không thể thay đổi trạng thái của chuyến đi đã hoàn thành');
      }
    }

    let scheduleId = trip.scheduleId;
    if (dto.scheduleId || (dto.routeId && dto.departureTime)) {
      scheduleId = await this.resolveScheduleId(dto);
    }

    const busId = dto.busId ?? trip.busId;
    const driverName = dto.driverName ?? trip.driverName;
    const departureDate = dto.departureDate ?? trip.departureDate;

    // Kiểm tra xung đột xe và tài xế (loại trừ chính nó)
    await this.checkConflicts(scheduleId, busId, driverName, departureDate, id);

    const { routeId, departureTime, ...tripData } = dto;
    Object.assign(trip, { ...tripData, scheduleId });
    return this.tripsRepo.save(trip);
  }

  async remove(id: number, cancelReason: string) {
    const trip = await this.findOne(id);
    trip.status = 'CANCELLED';
    trip.cancelReason = cancelReason;
    return this.tripsRepo.save(trip);
  }

  async applyDiscount(id: number, discountPercent: number) {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException('Phần trăm giảm giá phải từ 0 đến 100');
    }
    const trip = await this.findOne(id);
    trip.discountPercent = discountPercent;
    this.logger.log(`Áp dụng giảm giá ${discountPercent}% cho chuyến đi ID: ${id}`);
    return this.tripsRepo.save(trip);
  }

  /** Tính giá động cho một chuyến xe cụ thể */
  async getDynamicPrice(id: number) {
    const trip = await this.tripsRepo.findOne({
      where: { id },
      relations: ['schedule', 'schedule.route', 'bus'],
    });
    if (!trip) throw new NotFoundException('Không tìm thấy chuyến đi');

    const basePrice = Number(trip.schedule?.route?.basePrice ?? 0);
    const totalSeats = trip.bus?.totalSeats ?? 0;
    const availableSeats = trip.availableSeats;

    const result = calculateDynamicPrice(
      basePrice,
      trip.departureDate,
      availableSeats,
      totalSeats,
      trip.discountPercent || 0,
    );

    return {
      tripId: id,
      departureDate: trip.departureDate,
      route: `${trip.schedule?.route?.origin} → ${trip.schedule?.route?.destination}`,
      availableSeats,
      totalSeats,
      discountPercent: trip.discountPercent || 0,
      ...result,
    };
  }

  /**
   * Auto-dispatch & auto-complete trips:
   * Chạy mỗi phút:
   * 1. SCHEDULED → IN_PROGRESS: khi đến giờ khởi hành.
   * 2. IN_PROGRESS → COMPLETED: khi đã qua thời gian di chuyển ước tính (distance / 60 km/h).
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoDispatchTrips() {
    const now = new Date();
    
    // === 1. SCHEDULED → IN_PROGRESS ===
    const scheduledTrips = await this.tripsRepo.find({
      where: { status: 'SCHEDULED' },
      relations: ['schedule'],
    });

    for (const trip of scheduledTrips) {
      if (!trip.schedule || !trip.schedule.departureTime) continue;

      const departureDate = new Date(trip.departureDate);
      const [hours, minutes, seconds] = trip.schedule.departureTime.split(':').map(Number);
      departureDate.setHours(hours, minutes, seconds || 0, 0);

      if (now >= departureDate) {
        this.logger.log(`Tự động xuất bến chuyến đi ID: ${trip.id} lúc ${trip.schedule.departureTime}`);
        trip.status = 'IN_PROGRESS';
        await this.tripsRepo.save(trip);
      }
    }

    // === 2. IN_PROGRESS → COMPLETED ===
    const inProgressTrips = await this.tripsRepo.find({
      where: { status: 'IN_PROGRESS' },
      relations: ['schedule', 'schedule.route'],
    });

    for (const trip of inProgressTrips) {
      if (!trip.schedule || !trip.schedule.departureTime) continue;

      const departureDate = new Date(trip.departureDate);
      const [h, m, s] = trip.schedule.departureTime.split(':').map(Number);
      departureDate.setHours(h, m, s || 0, 0);

      // Ước tính thời gian di chuyển dựa trên khoảng cách (tốc độ trung bình 60 km/h), tối thiểu 1 giờ
      const distanceKm = trip.schedule.route?.distance || 100;
      const estimatedHours = Math.max(distanceKm / 60, 1);
      const estimatedArrival = new Date(departureDate.getTime() + estimatedHours * 60 * 60 * 1000);

      if (now >= estimatedArrival) {
        this.logger.log(
          `Tự động hoàn thành chuyến đi ID: ${trip.id} (ước tính ${estimatedHours.toFixed(1)}h, đến lúc ${estimatedArrival.toLocaleTimeString('vi-VN')})`,
        );
        trip.status = 'COMPLETED';
        await this.tripsRepo.save(trip);
      }
    }
  }
}
