import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  getBalance(supplierId: string) {
    return this.prisma.supplierWallet.findUnique({ where: { supplierId } });
  }

  statement(supplierId: string) {
    return this.prisma.walletTransaction.findMany({
      where: { walletId: supplierId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Technical plan §4.4 — the weekly payout run. Intended to be invoked by
   * a BullMQ cron job (technical plan §2/§6), not directly by an HTTP
   * request; exposed as a plain method here so it's independently testable.
   * Moves each wallet's pending balance to available, and would trigger the
   * actual bank transfer via whatever mechanism the payment gateway or a
   * banking integration provides (still open — decision #2).
   */
  async runWeeklyPayout() {
    const wallets = await this.prisma.supplierWallet.findMany({ where: { pendingBalance: { gt: 0 } } });
    for (const wallet of wallets) {
      await this.prisma.supplierWallet.update({
        where: { supplierId: wallet.supplierId },
        data: {
          availableBalance: { increment: wallet.pendingBalance },
          pendingBalance: 0,
        },
      });
      await this.prisma.walletTransaction.create({
        data: { walletId: wallet.supplierId, type: 'payout', amount: wallet.pendingBalance },
      });
      // TODO: trigger the actual bank transfer, then email/WhatsApp the
      // supplier their statement (feature spec §10 notifications table).
    }
    return { walletsPaid: wallets.length };
  }
}
