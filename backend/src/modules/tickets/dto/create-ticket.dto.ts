import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  tripId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  seatCount: number;

  @ApiProperty({ example: '123 Nguyễn Huệ, Q.1, TP.HCM' })
  @IsNotEmpty()
  @IsString()
  pickUpLocation: string;

  @ApiProperty({ example: '456 Trần Phú, TP. Đà Lạt' })
  @IsNotEmpty()
  @IsString()
  dropOffLocation: string;
}
