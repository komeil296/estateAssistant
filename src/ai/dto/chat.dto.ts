import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatHistoryMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user' })
  role!: 'user' | 'assistant';

  @ApiProperty({ example: 'بودجه‌ام تا شبی ۵ میلیون است.' })
  content!: string;
}

export class ChatDto {
  @ApiProperty({
    example: 'یک ویلای کنار دریا برای سه شب می‌خواهم',
    description: 'پیام جدید کاربر به دستیار املاک',
  })
  message!: string;

  @ApiPropertyOptional({
    type: [ChatHistoryMessageDto],
    description: 'تاریخچه اخیر گفتگو به ترتیب زمانی؛ فقط نقش user یا assistant مجاز است.',
  })
  history?: ChatHistoryMessageDto[];
}
