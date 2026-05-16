import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { Trip, Route } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Route])],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
