import { Body, Controller, Post, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.orders.checkout(req.user.sub, dto);
  }

  // TODO: GET /orders (customer history), GET /orders/supplier (supplier
  // queue), PATCH /orders/:id/collection-status, POST /orders/:itemId/refund
  // — per-item automatic refund per feature spec §6.4.
}
