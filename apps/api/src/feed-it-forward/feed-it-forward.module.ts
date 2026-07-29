import { Module } from '@nestjs/common';
import { FeedItForwardController } from './feed-it-forward.controller';
import { FeedItForwardService } from './feed-it-forward.service';

@Module({
  controllers: [FeedItForwardController],
  providers: [FeedItForwardService],
})
export class FeedItForwardModule {}
