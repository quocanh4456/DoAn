import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Route } from '../../entities';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route) private routesRepo: Repository<Route>,
  ) {}

  async findAll(search?: string) {
    const qb = this.routesRepo.createQueryBuilder('route');
    if (search) {
      qb.where(
        'route.origin LIKE :s OR route.destination LIKE :s',
        { s: `%${search}%` },
      );
    }
    qb.andWhere('route.isActive = :active', { active: true });
    return qb.getMany();
  }

  async findOne(id: number) {
    const route = await this.routesRepo.findOne({ where: { id } });
    if (!route) throw new NotFoundException('Không tìm thấy tuyến đường');
    return route;
  }

  async create(dto: CreateRouteDto) {
    const route = this.routesRepo.create(dto);
    return this.routesRepo.save(route);
  }

  async update(id: number, dto: UpdateRouteDto) {
    const route = await this.findOne(id);

    if (dto.origin !== undefined) route.origin = dto.origin.trim();
    if (dto.destination !== undefined) route.destination = dto.destination.trim();
    if (dto.distance !== undefined) route.distance = dto.distance;
    if (dto.basePrice !== undefined) route.basePrice = dto.basePrice;

    return this.routesRepo.save(route);
  }

  async remove(id: number) {
    const route = await this.findOne(id);
    route.isActive = false;
    return this.routesRepo.save(route);
  }
}
