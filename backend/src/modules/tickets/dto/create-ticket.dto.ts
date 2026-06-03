import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEmail, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ example: 'guest@email.com' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}
