import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateMultiPaymentDto } from './dto/create-multi-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-payos-url')
  createPayOSUrl(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayOSUrl(dto.ticketId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-payos-url-multi')
  createPayOSUrlMulti(@Body() dto: CreateMultiPaymentDto) {
    return this.paymentsService.createPayOSUrlMulti(dto.ticketIds);
  }

  @Get('payos-return')
  handlePayOSReturn(@Query() query: Record<string, string>) {
    return this.paymentsService.handlePayOSReturn(query);
  }
}
