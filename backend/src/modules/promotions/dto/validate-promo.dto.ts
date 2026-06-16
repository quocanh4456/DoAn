import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePromoDto {
  @ApiProperty({ example: 'NEWUSER20' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 500000, description: 'Tổng tiền trước giảm (để tính giảm tối đa)' })
  @IsNotEmpty()
  totalAmount: number;
}
