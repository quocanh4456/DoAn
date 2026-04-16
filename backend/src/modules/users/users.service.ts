import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.fullName = Like(`%${search}%`);
    }
    return this.usersRepo.find({ where, relations: ['role'] });
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email đã được sử dụng');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    return this.usersRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepo.remove(user);
  }
}
