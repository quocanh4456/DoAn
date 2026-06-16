import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../../entities';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private promosRepo: Repository<Promotion>,
  ) {}

  /** Lấy tất cả mã khuyến mãi (Admin) */
  async findAll() {
    return this.promosRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Validate mã khuyến mãi và trả về thông tin giảm giá.
   * @param code   Mã KM
   * @param totalAmount Tổng tiền trước giảm
   */
  async validate(code: string, totalAmount: number) {
    const promo = await this.promosRepo.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new BadRequestException('Mã khuyến mãi không tồn tại.');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Mã khuyến mãi đã ngưng hoạt động.');
    }

    const today = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (today < startDate || today > endDate) {
      throw new BadRequestException('Mã khuyến mãi đã hết hạn.');
    }

    if (promo.maxUsage > 0 && promo.usedCount >= promo.maxUsage) {
      throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng.');
    }

    // Tính số tiền giảm
    let discountAmount = Math.round(totalAmount * promo.discountPercent / 100);

    // Giới hạn giảm tối đa
    if (Number(promo.maxDiscount) > 0 && discountAmount > Number(promo.maxDiscount)) {
      discountAmount = Number(promo.maxDiscount);
    }

    return {
      valid: true,
      code: promo.code,
      description: promo.description,
      discountPercent: promo.discountPercent,
      discountAmount,
      maxDiscount: Number(promo.maxDiscount),
      finalAmount: totalAmount - discountAmount,
    };
  }

  /**
   * Tăng used_count khi vé được tạo thành công với mã KM.
   */
  async incrementUsage(code: string) {
    await this.promosRepo.increment({ code: code.toUpperCase() }, 'usedCount', 1);
  }
}
