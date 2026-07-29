import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FundraisingOrgType } from '@findi/shared';

@Injectable()
export class FundraisingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Feature spec §7 / decision #13 — an org registers and waits for
   * approval, the same "nothing is live until reviewed" shape as the
   * supplier pipeline (§5.2), just a single approval step rather than
   * per-category. The code is generated here rather than chosen by the
   * applicant, so it can't collide with or impersonate an existing one.
   */
  async apply(userId: string, name: string, type: FundraisingOrgType) {
    const code = await this.generateUniqueCode(name);
    return this.prisma.fundraisingOrganisation.create({
      data: { userId, name, type, code, status: 'pending' },
    });
  }

  async approve(orgId: string, actorId: string) {
    const org = await this.prisma.fundraisingOrganisation.update({
      where: { id: orgId },
      data: { status: 'approved' },
    });
    await this.prisma.auditLogEntry.create({
      data: { actorId, action: 'fundraising_org.approve', entity: 'FundraisingOrganisation', entityId: orgId },
    });
    return org;
  }

  pending() {
    return this.prisma.fundraisingOrganisation.findMany({ where: { status: 'pending' } });
  }

  private async generateUniqueCode(name: string): Promise<string> {
    const base = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'FINDI';
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `${base}${suffix}`;
      const existing = await this.prisma.fundraisingOrganisation.findUnique({ where: { code: candidate } });
      if (!existing) return candidate;
    }
    throw new Error('Could not generate a unique fundraising code — try again');
  }

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
