import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
