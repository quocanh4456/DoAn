import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, Bus } from '../../entities';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

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
      .where('trip.status = :status', { status: 'SCHEDULED' });

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

    return qb.getMany();
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
}
