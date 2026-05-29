import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, Role } from '../../entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmailService } from '../email/email.service';

/** In-memory token store: token → { userId, expiresAt } */
interface ResetEntry {
  userId: number;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly resetTokens = new Map<string, ResetEntry>();

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
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

  // ─── Quên mật khẩu ───────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    // Luôn trả về thành công để không lộ email tồn tại hay không
    if (!user || !user.isActive) {
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' };
    }

    // Tạo token ngẫu nhiên, lưu vào store 15 phút
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút
    this.resetTokens.set(token, { userId: user.id, expiresAt });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, user.fullName, resetLink);

    return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' };
  }

  // ─── Đặt lại mật khẩu ────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const entry = this.resetTokens.get(dto.token);

    if (!entry) {
      throw new BadRequestException('Token không hợp lệ hoặc đã được sử dụng');
    }
    if (Date.now() > entry.expiresAt) {
      this.resetTokens.delete(dto.token);
      throw new BadRequestException('Token đã hết hạn, vui lòng yêu cầu lại');
    }

    const user = await this.usersRepo.findOne({ where: { id: entry.userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);

    // Xóa token sau khi dùng (one-time use)
    this.resetTokens.delete(dto.token);

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  // ─── Đổi mật khẩu (đã đăng nhập) ────────────────────────────────────────────

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu cũ');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  // ─── Xem & Sửa thông tin cá nhân ────────────────────────────────────────────

  async getMyProfile(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    // Không trả về password
    const { password, ...safe } = user as any;
    return safe;
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    user.fullName = dto.fullName;
    user.phone    = dto.phone;
    await this.usersRepo.save(user);

    return { message: 'Cập nhật thông tin thành công', fullName: user.fullName, phone: user.phone };
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────


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
