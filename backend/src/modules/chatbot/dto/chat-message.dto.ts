import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
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
}
