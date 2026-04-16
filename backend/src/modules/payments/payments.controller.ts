import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-vnpay-url')
  createVnpayUrl(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      '127.0.0.1';
    return this.paymentsService.createVnpayUrl(dto.ticketId, ipAddr);
  }

  @Get('vnpay-return')
  handleVnpayReturn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayReturn(query);
  }
}
