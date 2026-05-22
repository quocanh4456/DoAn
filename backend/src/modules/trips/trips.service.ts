import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, Bus } from '../../entities';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { calculateTripBasePrice, calculateDynamicPrice } from '../../common/utils/pricing.util';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    @InjectRepository(Bus) private busesRepo: Repository<Bus>,
  ) {}

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
        const adjustedPrice = calculateTripBasePrice(
          Number(trip.schedule.route.basePrice),
          trip.departureDate,
        );
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

  async create(dto: CreateTripDto) {
    const bus = await this.busesRepo.findOne({ where: { id: dto.busId } });
    if (!bus) throw new NotFoundException('Không tìm thấy phương tiện');

    const trip = this.tripsRepo.create({
      ...dto,
      availableSeats: bus.totalSeats,
    });
    return this.tripsRepo.save(trip);
  }

  async update(id: number, dto: UpdateTripDto) {
    const trip = await this.findOne(id);
    Object.assign(trip, dto);
    return this.tripsRepo.save(trip);
  }

  async remove(id: number) {
    const trip = await this.findOne(id);
    trip.status = 'CANCELLED';
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
    );

    return {
      tripId: id,
      departureDate: trip.departureDate,
      route: `${trip.schedule?.route?.origin} → ${trip.schedule?.route?.destination}`,
      availableSeats,
      totalSeats,
      ...result,
    };
  }
}
