import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  routeId: number;

  @ApiProperty({ example: '07:00' })
  @IsNotEmpty()
  @IsString()
  departureTime: string;
}
