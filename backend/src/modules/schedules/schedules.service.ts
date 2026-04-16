import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const schedule = this.schedulesRepo.create(dto);
    return this.schedulesRepo.save(schedule);
  }

  async update(id: number, dto: UpdateScheduleDto) {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.schedulesRepo.save(schedule);
  }

  async remove(id: number) {
    const schedule = await this.findOne(id);
    schedule.isActive = false;
    return this.schedulesRepo.save(schedule);
  }
}
