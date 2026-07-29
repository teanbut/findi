import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  create(customerId: string, orderItemId: string, supplierId: string, rating: number, comment?: string) {
    return this.prisma.review.create({
      data: { customerId, orderItemId, supplierId, rating, comment },
    });
  }

  reply(reviewId: string, supplierReply: string) {
    return this.prisma.review.update({ where: { id: reviewId }, data: { supplierReply } });
  }

  forSupplier(supplierId: string) {
    return this.prisma.review.findMany({ where: { supplierId }, orderBy: { createdAt: 'desc' } });
  }

  // Feeds the Findi Approved Seller "customer service" criterion
  // (feature spec §5.6) — a simple average for now.
  async averageRating(supplierId: string) {
    const result = await this.prisma.review.aggregate({ where: { supplierId }, _avg: { rating: true } });
    return { supplierId, averageRating: result._avg.rating ?? null };
  }
}
