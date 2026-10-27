import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { SearchRequestDto } from './dto/search-request.dto';

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

  @Post('parse-search')
  @ApiOperation({
    summary: 'تبدیل درخواست مشتری به فیلتر استاندارد جست‌وجوی ملک',
    description:
      'خروجی مدل اعتبارسنجی می‌شود؛ این endpoint فقط درخواست را تحلیل می‌کند و هنوز جست‌وجوی واقعی در پایگاه داده انجام نمی‌دهد.',
  })
  @ApiOkResponse({ type: SearchRequestDto })
  async parseSearchRequest(@Body() body: ChatDto): Promise<SearchRequestDto> {
    if (typeof body?.message !== 'string' || !body.message.trim()) {
      throw new BadRequestException('متن درخواست الزامی است.');
    }

    return this.aiService.parseSearchRequest(body.message.trim());
  }
}
