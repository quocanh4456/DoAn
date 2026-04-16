import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusDto {
  @ApiProperty({ example: '51B-123.45' })
  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @ApiProperty({ example: 'Giường nằm', description: 'Giường nằm / Ghế ngồi' })
  @IsNotEmpty()
  @IsString()
  busType: string;

  @ApiProperty({ example: 16 })
  @IsNumber()
  @Min(1)
  totalSeats: number;
}
