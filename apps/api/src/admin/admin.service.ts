import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Feature spec §12 — "search any order, view full timeline across every
  // supplier in a multi-supplier order." Most recent first; a real search
  // (by customer, supplier, status, date range) is a reasonable next step
  // once there's enough order volume for a flat recent-list to stop being
  // useful — not needed yet.
  orders() {
    return this.prisma.order.findMany({
      include: {
        items: { include: { listing: true } },
        paymentSplits: true,
        fundraisingOrg: true,
      },
      orderBy: { placedAt: 'desc' },
      take: 100,
    });
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { listing: { include: { supplier: true } } } },
        paymentSplits: true,
        fundraisingOrg: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Manual intervention (feature spec §12: "manually intervene — refund,
   * reassign, cancel"). This marks the order cancelled and logs it; it does
   * NOT reverse the PaymentSplit rows or trigger a real refund — that needs
   * the payment gateway (still open, feature spec §18 #2). Flagged rather
   * than silently pretended-away: cancelling here today means the money
   * movement still has to be sorted out manually until the gateway exists.
   */
  async cancelOrder(id: string, actorId: string, reason: string) {
    const order = await this.prisma.order.update({ where: { id }, data: { status: 'cancelled' } });
    await this.prisma.auditLogEntry.create({
      data: { actorId, action: 'order.cancel', entity: 'Order', entityId: id, after: { reason } },
    });
    return order;
  }

  // Feature spec §12 admin console — approval queue.
  pendingSuppliers() {
    return this.prisma.supplierProfile.findMany({
      where: { status: 'pending' },
      include: { categories: { include: { category: true } } },
    });
  }

  pendingCategoryRequests() {
    return this.prisma.supplierCategory.findMany({
      where: { status: 'pending' },
      include: { supplier: true, category: true },
    });
  }

  // Revenue reporting — reads ONLY findi_commission rows, structurally
  // excluding Feed It Forward and Fundraising splits (feature spec §6.4/§11.3).
  async revenue(from: Date, to: Date) {
    const result = await this.prisma.paymentSplit.aggregate({
      where: { recipientType: 'findi_commission', order: { placedAt: { gte: from, lte: to } } },
      _sum: { amount: true },
    });
    return { from, to, findiCommissionRevenue: Number(result._sum.amount ?? 0) };
  }

  auditLog(entity?: string) {
    return this.prisma.auditLogEntry.findMany({
      where: entity ? { entity } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
