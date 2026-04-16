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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketsService.create(dto, req.user.id);
  }

  @Get('my')
  findMy(@Req() req: any) {
    return this.ticketsService.findByUser(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('Admin', 'Staff')
  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ticketsService.cancel(id, req.user.id);
  }
}
