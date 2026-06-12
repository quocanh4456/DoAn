import { IsNotEmpty, IsNumber, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  scheduleId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  routeId?: number;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'departureTime must be in HH:mm format',
  })
  departureTime?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  busId: number;

  @ApiProperty({ example: 'Trần Văn B' })
  @IsNotEmpty()
  @IsString()
  driverName: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsNotEmpty()
  @IsString()
  departureDate: string;
}
