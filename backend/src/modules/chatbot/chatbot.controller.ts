import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gửi tin nhắn tới chatbot AI (Dify)',
    description:
      'Nhận tin nhắn từ client, forward tới Dify API và trả về phản hồi. Hỗ trợ đặt vé tự động nếu gửi kèm userId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Phản hồi từ chatbot AI',
    schema: {
      example: {
        answer: 'Xin chào! Tôi có thể giúp bạn tra cứu chuyến xe...',
        conversation_id: 'abc-123-def',
        message_id: 'msg-xyz',
      },
    },
  })
  @ApiResponse({ status: 502, description: 'Lỗi kết nối tới Dify API' })
  @ApiResponse({ status: 503, description: 'Dịch vụ chatbot không khả dụng' })
  async sendMessage(@Body() dto: ChatMessageDto) {
    return this.chatbotService.sendMessage(dto);
  }
}

