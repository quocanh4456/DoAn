import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  scheduleId: number;

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
