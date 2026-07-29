import { Module } from '@nestjs/common';
import { FundraisingController } from './fundraising.controller';
import { FundraisingService } from './fundraising.service';

@Module({
  controllers: [FundraisingController],
  providers: [FundraisingService],
})
export class FundraisingModule {}
