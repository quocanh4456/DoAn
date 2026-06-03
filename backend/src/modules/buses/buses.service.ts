import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Bus } from '../../entities';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Injectable()
export class BusesService {
  constructor(
    @InjectRepository(Bus) private busesRepo: Repository<Bus>,
  ) {}

  async findAll(search?: string, busType?: string, status?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.licensePlate = Like(`%${search}%`);
    }
    if (busType) {
      where.busType = busType;
    }
    if (status) {
      where.status = status;
    }
    return this.busesRepo.find({ where });
  }

  async findOne(id: number) {
    const bus = await this.busesRepo.findOne({ where: { id } });
    if (!bus) throw new NotFoundException('Không tìm thấy phương tiện');
    return bus;
  }

  async create(dto: CreateBusDto) {
    const exists = await this.busesRepo.findOne({
      where: { licensePlate: dto.licensePlate, isActive: true },
    });
    if (exists) throw new ConflictException('Biển số xe đã tồn tại');

    const bus = this.busesRepo.create(dto);
    return this.busesRepo.save(bus);
  }

  async update(id: number, dto: UpdateBusDto) {
    const bus = await this.findOne(id);

    if (dto.licensePlate && dto.licensePlate !== bus.licensePlate) {
      const exists = await this.busesRepo.findOne({
        where: { licensePlate: dto.licensePlate, isActive: true },
      });
      if (exists && exists.id !== id) {
        throw new ConflictException('Biển số xe đã tồn tại');
      }
    }

    Object.assign(bus, dto);
    return this.busesRepo.save(bus);
  }

  async remove(id: number) {
    const bus = await this.findOne(id);
    bus.isActive = false;
    return this.busesRepo.save(bus);
  }
}
