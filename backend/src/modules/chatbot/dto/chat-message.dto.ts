import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'Nội dung tin nhắn của người dùng' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'ID cuộc hội thoại (để duy trì ngữ cảnh). Để trống nếu bắt đầu cuộc hội thoại mới.',
  })
  @IsString()
  @IsOptional()
  conversation_id?: string;

  @ApiPropertyOptional({ description: 'ID người dùng (dùng để Dify phân biệt session)' })
  @IsString()
  @IsOptional()
  user?: string;

  @ApiPropertyOptional({ description: 'ID user đã đăng nhập (để đặt vé qua chatbot)' })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
