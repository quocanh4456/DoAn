import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsNotEmpty()
  @IsString()
  origin: string;

  @ApiProperty({ example: 'Đà Lạt' })
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiProperty({ example: 310 })
  @IsNumber()
  @Min(0)
  distance: number;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  basePrice: number;
}
