import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket, Trip, User, Payment } from '../../entities';
import { PaymentsModule } from '../payments/payments.module';
import { EmailModule } from '../email/email.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Trip, User, Payment]),
    ConfigModule,
    forwardRef(() => PaymentsModule),
    EmailModule,
    PromotionsModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
