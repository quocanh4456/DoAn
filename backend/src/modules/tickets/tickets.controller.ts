import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('Tickets')
@Controller('api/tickets')
export class TicketsController {
  constructor(
    private ticketsService: TicketsService,
    private paymentsService: PaymentsService,
  ) {}

  
  @Get(':id/guest-info')
  getGuestTicket(
    @Param('id', ParseIntPipe) id: number,
    @Query('email') email: string,
  ) {
    return this.ticketsService.getGuestTicket(id, email);
  }

  
  @Post(':id/guest-payment')
  createGuestPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('email') email: string,
  ) {
    return this.paymentsService.createGuestPaymentUrl(id, email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketsService.create(dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@Req() req: any) {
    return this.ticketsService.findByUser(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Staff')
  @Get()
  findAll(@Query('search') search?: string) {
    return this.ticketsService.findAll(search);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Staff')
  @Patch(':id/confirm-cash')
  confirmCash(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ticketsService.confirmCashPayment(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Body('reason') reason?: string) {
    return this.ticketsService.cancel(id, req.user, reason);
  }
}
