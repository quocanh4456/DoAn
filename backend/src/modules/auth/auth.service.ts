import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../../entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email đã được sử dụng');
    }

    let customerRole = await this.rolesRepo.findOne({
      where: { name: 'Customer' },
    });
    if (!customerRole) {
      customerRole = this.rolesRepo.create({ name: 'Customer' });
      await this.rolesRepo.save(customerRole);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
      roleId: customerRole.id,
    });
    await this.usersRepo.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'fullName', 'isActive', 'roleId'],
      relations: ['role'],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepo.findOne({
        where: { id: payload.sub },
        relations: ['role'],
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || 3600,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN') || 604800,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role?.name,
      },
    };
  }
}
