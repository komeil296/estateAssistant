import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'ارسال پیام به دستیار هوشمند املاک' })
  async chat(@Body() body: ChatDto) {
    if (typeof body?.message !== 'string' || !body.message.trim()) {
      throw new BadRequestException('متن پیام الزامی است.');
    }

    return this.aiService.chat(body.message.trim());
  }
}
