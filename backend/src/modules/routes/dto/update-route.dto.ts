import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateRouteDto {
  @ApiPropertyOptional({ example: 'TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  origin?: string;

  @ApiPropertyOptional({ example: 'Đà Lạt' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  destination?: string;

  @ApiPropertyOptional({ example: 310 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;
}
