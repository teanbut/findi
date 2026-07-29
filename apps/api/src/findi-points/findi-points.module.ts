import { Module } from '@nestjs/common';
import { FindiPointsController } from './findi-points.controller';
import { FindiPointsService } from './findi-points.service';

@Module({
  controllers: [FindiPointsController],
  providers: [FindiPointsService],
  exports: [FindiPointsService],
})
export class FindiPointsModule {}
