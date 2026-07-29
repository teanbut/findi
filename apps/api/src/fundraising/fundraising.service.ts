import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FundraisingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Feature spec §7 — the org's own read-only dashboard: total raised,
   * supporter count (distinct customers), order count. All three are
   * aggregates over FundraisingLedgerEntry, never a separate "reporting"
   * system to keep in sync.
   */
  async dashboard(orgId: string) {
    const org = await this.prisma.fundraisingOrganisation.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Fundraising organisation not found');

    const [totals, orders] = await Promise.all([
      this.prisma.fundraisingLedgerEntry.aggregate({ where: { orgId }, _sum: { amount: true } }),
      this.prisma.order.findMany({ where: { fundraisingOrgId: orgId }, select: { id: true, customerId: true } }),
    ]);

    const supporterCount = new Set(orders.map((o) => o.customerId)).size;

    return {
      orgId,
      totalRaised: Number(totals._sum.amount ?? 0),
      supporterCount,
      orderCount: orders.length,
    };
  }

  /** Proposed monthly cadence (feature spec §7.1, decision #12). */
  async runPayout(orgId: string, periodStart: Date, periodEnd: Date) {
    const entries = await this.prisma.fundraisingLedgerEntry.aggregate({
      where: { orgId, createdAt: { gte: periodStart, lte: periodEnd } },
      _sum: { amount: true },
    });
    const amount = Number(entries._sum.amount ?? 0);
    if (amount === 0) return null;
    return this.prisma.fundraisingPayout.create({
      data: { orgId, amount, periodStart, periodEnd },
    });
  }
}
