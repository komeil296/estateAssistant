import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DivarSearchService } from './divar-search.service';

@Module({
  controllers: [AiController],
  providers: [AiService, DivarSearchService],
})
export class AiModule {}
