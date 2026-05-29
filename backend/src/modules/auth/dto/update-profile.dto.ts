import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
