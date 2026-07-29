import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';

function buildPrismaMock() {
  return {
    supplierWallet: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    walletTransaction: { create: jest.fn() },
  } as any;
}

describe('WalletService.withdraw', () => {
  it('rejects a zero or negative amount', async () => {
    const prisma = buildPrismaMock();
    const service = new WalletService(prisma);
    await expect(service.withdraw('supplier-1', 0)).rejects.toThrow(BadRequestException);
    await expect(service.withdraw('supplier-1', -10)).rejects.toThrow(BadRequestException);
  });

  it('rejects when the supplier has no wallet yet', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierWallet.findUnique.mockResolvedValue(null);
    const service = new WalletService(prisma);
    await expect(service.withdraw('supplier-1', 100)).rejects.toThrow(NotFoundException);
  });

  it('rejects a withdrawal that exceeds the available balance', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierWallet.findUnique.mockResolvedValue({ availableBalance: 50, pendingBalance: 200 });
    const service = new WalletService(prisma);
    // Pending balance isn't withdrawable yet — only available.
    await expect(service.withdraw('supplier-1', 100)).rejects.toThrow(BadRequestException);
  });

  it('decrements available balance and records a negative payout transaction', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierWallet.findUnique.mockResolvedValue({ availableBalance: 500, pendingBalance: 0 });
    prisma.walletTransaction.create.mockResolvedValue({ amount: -200 });
    const service = new WalletService(prisma);

    await service.withdraw('supplier-1', 200);

    expect(prisma.supplierWallet.update).toHaveBeenCalledWith({
      where: { supplierId: 'supplier-1' },
      data: { availableBalance: { decrement: 200 } },
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: { walletId: 'supplier-1', type: 'payout', amount: -200 },
    });
  });
});
