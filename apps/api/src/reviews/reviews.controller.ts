import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Roles('customer')
  @Post()
  create(@Req() req: any, @Body() body: { orderItemId: string; supplierId: string; rating: number; comment?: string }) {
    return this.reviews.create(req.user.sub, body.orderItemId, body.supplierId, body.rating, body.comment);
  }

  @Roles('supplier')
  @Patch(':id/reply')
  reply(@Param('id') id: string, @Req() req: any, @Body() body: { supplierReply: string }) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.reviews.reply(id, req.user.supplierId, body.supplierReply);
  }

  // Public storefront data.
  @Public()
  @Get('supplier/:supplierId')
  forSupplier(@Param('supplierId') supplierId: string) {
    return this.reviews.forSupplier(supplierId);
  }
}
