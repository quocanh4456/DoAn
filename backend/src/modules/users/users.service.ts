import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
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
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (exists) throw new ConflictException('Email hoặc Số điện thoại đã được sử dụng cho một nhân viên khác. Vui lòng kiểm tra lại!');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    return this.usersRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto, currentUserId?: number) {
    if (currentUserId && id === currentUserId && dto.roleId !== undefined) {
      throw new BadRequestException('Bạn không thể tự khóa hoặc thay đổi quyền của chính tài khoản mình đang sử dụng!');
    }

    const user = await this.findOne(id);

    const conditions: any[] = [];
    if (dto.email) conditions.push({ email: dto.email });
    if (dto.phone) conditions.push({ phone: dto.phone });
    
    if (conditions.length > 0) {
      const exists = await this.usersRepo.findOne({ where: conditions });
      if (exists && exists.id !== id) {
        throw new ConflictException('Email hoặc Số điện thoại đã được sử dụng cho một nhân viên khác. Vui lòng kiểm tra lại!');
      }
    }

    if (dto.password && dto.password.trim()) {
      dto.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete dto.password;
    }

    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async remove(id: number, currentUserId?: number) {
    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('Bạn không thể tự khóa hoặc thay đổi quyền của chính tài khoản mình đang sử dụng!');
    }
    const user = await this.findOne(id);
    return this.usersRepo.remove(user);
  }
}
