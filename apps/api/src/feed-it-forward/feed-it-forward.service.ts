import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedItForwardService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin ledger view — deliberately reads ONLY this table, never joined
  // against PaymentSplit rows of type findi_commission (feature spec §6.4).
  async ledgerTotal() {
    const result = await this.prisma.feedItForwardLedgerEntry.aggregate({ _sum: { amount: true } });
    const disbursed = await this.prisma.feedItForwardDisbursement.aggregate({ _sum: { amount: true } });
    const collected = Number(result._sum.amount ?? 0);
    const paidOut = Number(disbursed._sum.amount ?? 0);
    return { collected, disbursed: paidOut, available: collected - paidOut };
  }

  /** A supplier flags surplus stock as an in-kind donation (feature spec §6.3). */
  recordSupplierDonation(supplierId: string, amount: number) {
    return this.prisma.feedItForwardLedgerEntry.create({
      data: { sourceType: 'supplier_donation', supplierId, amount },
    });
  }

  // Admin-only — feature spec §6.6 governance: every disbursement needs a
  // recipient, amount, date and approver on record.
  disburse(recipient: string, amount: number, approvedBy: string, note?: string) {
    return this.prisma.feedItForwardDisbursement.create({
      data: { recipient, amount, approvedBy, note },
    });
  }
}
