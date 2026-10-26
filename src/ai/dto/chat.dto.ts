import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({
    example: 'یک ویلای کنار دریا برای سه شب می‌خواهم',
    description: 'پیام کاربر به دستیار املاک',
  })
  message!: string;
}
