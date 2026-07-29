import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from './commission.service';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Percentage of FINDI'S commission (never the supplier's share) allocated
 * to a supporting Fundraising organisation when a code is attached.
 * Placeholder default — this is open business decision #12 in the feature
 * spec and needs sign-off before launch.
 */
const FUNDRAISING_COMMISSION_SHARE = 0.5; // 50% of Findi's commission on that order

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commission: CommissionService,
  ) {}

  /**
   * The core mechanic from FINDI_TECHNICAL_DESIGN_AND_IMPLEMENTATION_PLAN.md
   * §4.1 and the proposal's R380 worked example: one basket, N suppliers,
   * one payment, split automatically. Everything downstream (Findi Wallet
   * balances, weekly payouts, Feed It Forward/Fundraising ledgers) reads
   * from the PaymentSplit rows this method writes — get this right once,
   * here, rather than reimplementing the split logic at each consumer.
   *
   * NOTE: payment-gateway capture happens BEFORE this is called in the real
   * flow — this method assumes payment has already been authorised for
   * `total`, and its job is purely to record the order and the split
   * correctly in one transaction. Gateway integration is decision #2
   * (feature spec §18) and still open.
   */
  async checkout(customerId: string, dto: CheckoutDto) {
    if (dto.items.length === 0) throw new BadRequestException('Basket is empty');

    const listings = await this.prisma.listing.findMany({
      where: { id: { in: dto.items.map((i) => i.listingId) }, status: 'active' },
      include: { supplier: true },
    });
    if (listings.length !== dto.items.length) {
      throw new NotFoundException('One or more listings are no longer available');
    }

    const fundraisingOrg = dto.fundraisingCode
      ? await this.prisma.fundraisingOrganisation.findUnique({ where: { code: dto.fundraisingCode } })
      : null;
    if (dto.fundraisingCode && !fundraisingOrg) {
      throw new BadRequestException('Unknown fundraising code');
    }

    let subtotal = 0;
    const supplierSplits: { supplierId: string; net: number; commission: number }[] = [];

    for (const item of dto.items) {
      const listing = listings.find((l) => l.id === item.listingId)!;
      if (listing.quantityAvailable < item.quantity) {
        throw new BadRequestException(`Not enough stock for "${listing.title}"`);
      }
      const lineTotal = Number(listing.discountedPrice) * item.quantity;
      subtotal += lineTotal;

      const rate = this.commission.rateFor(listing.supplier.tier);
      const commissionAmount = round2(lineTotal * rate);
      const net = round2(lineTotal - commissionAmount);

      const existing = supplierSplits.find((s) => s.supplierId === listing.supplierId);
      if (existing) {
        existing.net += net;
        existing.commission += commissionAmount;
      } else {
        supplierSplits.push({ supplierId: listing.supplierId, net, commission: commissionAmount });
      }
    }

    const feedItForwardAmount = computeFeedItForward(subtotal, dto.feedItForward);
    const totalCommission = round2(supplierSplits.reduce((sum, s) => sum + s.commission, 0));
    const fundraisingAmount = fundraisingOrg ? round2(totalCommission * FUNDRAISING_COMMISSION_SHARE) : 0;
    const findiCommissionAmount = round2(totalCommission - fundraisingAmount);
    const total = round2(subtotal + feedItForwardAmount);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId,
          fundraisingOrgId: fundraisingOrg?.id,
          status: 'placed',
          subtotal,
          feedItForwardAmount,
          total,
          items: {
            create: dto.items.map((item) => {
              const listing = listings.find((l) => l.id === item.listingId)!;
              return {
                listingId: listing.id,
                supplierId: listing.supplierId,
                quantity: item.quantity,
                unitPrice: listing.discountedPrice,
                lineTotal: Number(listing.discountedPrice) * item.quantity,
                collectionStatus: 'pending',
              };
            }),
          },
        },
        include: { items: true },
      });

      // Decrement stock per listing.
      for (const item of dto.items) {
        await tx.listing.update({
          where: { id: item.listingId },
          data: { quantityAvailable: { decrement: item.quantity } },
        });
      }

      // One PaymentSplit row per recipient — the queryable record behind
      // the worked example (Farmer R160 / Honey R108 / Findi commission R40).
      const splitRows = [
        ...supplierSplits.map((s) => ({
          orderId: order.id,
          recipientType: 'supplier' as const,
          recipientId: s.supplierId,
          amount: s.net,
          status: 'pending' as const,
        })),
        {
          orderId: order.id,
          recipientType: 'findi_commission' as const,
          recipientId: null,
          amount: findiCommissionAmount,
          status: 'settled' as const,
        },
      ];
      if (feedItForwardAmount > 0) {
        splitRows.push({
          orderId: order.id,
          recipientType: 'feed_it_forward' as const,
          recipientId: null,
          amount: feedItForwardAmount,
          status: 'settled' as const,
        });
      }
      if (fundraisingOrg) {
        splitRows.push({
          orderId: order.id,
          recipientType: 'fundraising_org' as const,
          recipientId: fundraisingOrg.id,
          amount: fundraisingAmount,
          status: 'settled' as const,
        });
      }
      await tx.paymentSplit.createMany({ data: splitRows });

      // Credit each supplier's wallet pending balance immediately —
      // it moves pending → available on the next weekly payout run
      // (technical plan §4.4), not paid out per order.
      for (const s of supplierSplits) {
        await tx.supplierWallet.upsert({
          where: { supplierId: s.supplierId },
          create: { supplierId: s.supplierId, pendingBalance: s.net },
          update: { pendingBalance: { increment: s.net } },
        });
        await tx.walletTransaction.create({
          data: { walletId: s.supplierId, orderId: order.id, type: 'sale', amount: s.net },
        });
      }

      if (feedItForwardAmount > 0) {
        await tx.feedItForwardLedgerEntry.create({
          data: { sourceType: 'customer_order', orderId: order.id, amount: feedItForwardAmount },
        });
      }
      if (fundraisingOrg) {
        await tx.fundraisingLedgerEntry.create({
          data: { orgId: fundraisingOrg.id, orderId: order.id, amount: fundraisingAmount },
        });
      }

      return { order, splits: splitRows };
    });
  }
}

function computeFeedItForward(subtotal: number, cfg?: CheckoutDto['feedItForward']): number {
  if (!cfg) return 0;
  if (cfg.mode === 'round_up') {
    const roundedUp = Math.ceil(subtotal / 10) * 10; // round up to nearest R10, e.g. 287.50 -> 290
    return round2(roundedUp - subtotal);
  }
  // 'fixed' — R1, R5 or R10 chosen at checkout (feature spec §6.2)
  return round2(cfg.amount ?? 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
