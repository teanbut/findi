import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  create(@Req() req: any, @Body() body: { orderItemId: string; supplierId: string; rating: number; comment?: string }) {
    return this.reviews.create(req.user.sub, body.orderItemId, body.supplierId, body.rating, body.comment);
  }

  @Patch(':id/reply')
  reply(@Param('id') id: string, @Body() body: { supplierReply: string }) {
    return this.reviews.reply(id, body.supplierReply);
  }

  @Get('supplier/:supplierId')
  forSupplier(@Param('supplierId') supplierId: string) {
    return this.reviews.forSupplier(supplierId);
  }
}
