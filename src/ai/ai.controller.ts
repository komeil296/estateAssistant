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

    const history = body.history ?? [];
    if (!Array.isArray(history)) {
      throw new BadRequestException('تاریخچه گفتگو باید آرایه باشد.');
    }
    for (const item of history) {
      if (
        !item ||
        (item.role !== 'user' && item.role !== 'assistant') ||
        typeof item.content !== 'string' ||
        !item.content.trim()
      ) {
        throw new BadRequestException(
          'هر پیام تاریخچه باید نقش user یا assistant و متن معتبر داشته باشد.',
        );
      }
    }

    return this.aiService.chat(body.message.trim(), history);
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
