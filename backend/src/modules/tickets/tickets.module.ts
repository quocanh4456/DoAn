import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket, Trip, User, Payment } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Trip, User, Payment]), ConfigModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
