import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMultiPaymentDto {
  @ApiProperty({ example: [1, 2], description: 'Danh sách ID các vé cần thanh toán' })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  ticketIds: number[];
}
