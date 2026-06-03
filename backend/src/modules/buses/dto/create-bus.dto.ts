import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsIn } from 'class-validator';
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

  @ApiProperty({
    example: 'AVAILABLE',
    description: 'AVAILABLE / IN_TRANSIT / MAINTENANCE / OUT_OF_SERVICE',
    required: false,
  })
  @IsOptional()
  @IsIn(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE'])
  status?: string;
}
