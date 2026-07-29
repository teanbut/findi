import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CommissionService } from './commission.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, CommissionService],
  exports: [OrdersService],
})
export class OrdersModule {}
