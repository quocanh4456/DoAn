import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Payment, Ticket, Trip } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Ticket, Trip])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
