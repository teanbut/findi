import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FindiPointsTransactionType } from '@findi/shared';

// Feature spec §9 — deliberately simple at launch: earn only, no tiers or
// multipliers. Points-per-Rand / per-referral / per-review rates are open
// decision #14 — placeholders below, move to config once confirmed.
const POINTS_PER_RAND_SPENT = 1;
const POINTS_PER_REFERRAL = 100;
const POINTS_PER_REVIEW = 20;

@Injectable()
export class FindiPointsService {
  constructor(private readonly prisma: PrismaService) {}

  award(customerId: string, type: FindiPointsTransactionType, orderId?: string, explicitPoints?: number) {
    const points = explicitPoints ?? this.defaultPointsFor(type);
    return this.prisma.findiPointsTransaction.create({
      data: { customerId, type, points, orderId },
    });
  }

  private defaultPointsFor(type: FindiPointsTransactionType): number {
    switch (type) {
      case 'referral':
        return POINTS_PER_REFERRAL;
      case 'review':
        return POINTS_PER_REVIEW;
      default:
        return 0;
    }
  }

  async balance(customerId: string) {
    const rows = await this.prisma.findiPointsTransaction.aggregate({
      where: { customerId },
      _sum: { points: true },
    });
    return { customerId, balance: rows._sum.points ?? 0 };
  }

  purchasePoints(subtotal: number): number {
    return Math.floor(subtotal * POINTS_PER_RAND_SPENT);
  }

  // TODO: redeem() / donateToFeedItForward() — Growth-phase feature spec §9,
  // deferred until earning is proven per the roadmap (§17).
}
