import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Schedule } from '../../entities';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule) private schedulesRepo: Repository<Schedule>,
  ) {}

  async findAll(routeId?: number) {
    const where: any = { isActive: true };
    if (routeId) where.routeId = routeId;
    return this.schedulesRepo.find({ where, relations: ['route'] });
  }

  async findOne(id: number) {
    const schedule = await this.schedulesRepo.findOne({
      where: { id },
      relations: ['route'],
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy khung giờ');
    return schedule;
  }

  async create(dto: CreateScheduleDto) {
    const existing = await this.schedulesRepo.findOne({
      where: {
        routeId: dto.routeId,
        departureTime: dto.departureTime,
        isActive: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Khung giờ này đã tồn tại trên tuyến đường, vui lòng kiểm tra lại',
      );
    }

    const schedule = this.schedulesRepo.create(dto);
    return this.schedulesRepo.save(schedule);
  }

  async update(id: number, dto: UpdateScheduleDto) {
    const schedule = await this.findOne(id);

    const routeId = dto.routeId ?? schedule.routeId;
    const departureTime = dto.departureTime ?? schedule.departureTime;
    const existing = await this.schedulesRepo.findOne({
      where: {
        id: Not(id),
        routeId,
        departureTime,
        isActive: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Khung giờ này đã tồn tại trên tuyến đường, vui lòng kiểm tra lại',
      );
    }

    Object.assign(schedule, dto);
    return this.schedulesRepo.save(schedule);
  }

  async remove(id: number) {
    const schedule = await this.findOne(id);
    schedule.isActive = false;
    return this.schedulesRepo.save(schedule);
  }
}