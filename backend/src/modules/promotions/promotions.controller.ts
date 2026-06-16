import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Promotions')
@Controller('api/promotions')
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  /** Validate mã khuyến mãi (cần đăng nhập) */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  validate(@Body() dto: ValidatePromoDto) {
    return this.promotionsService.validate(dto.code, dto.totalAmount);
  }

  /** Admin: lấy tất cả mã khuyến mãi */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }
}
