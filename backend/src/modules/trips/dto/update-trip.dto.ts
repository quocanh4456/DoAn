import { PartialType } from '@nestjs/swagger';
import { CreateTripDto } from './create-trip.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;
}
