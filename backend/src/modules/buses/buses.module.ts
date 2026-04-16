import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusesController } from './buses.controller';
import { BusesService } from './buses.service';
import { Bus } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Bus])],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}
