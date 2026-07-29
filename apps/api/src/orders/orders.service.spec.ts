import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CommissionService } from './commission.service';

/**
 * Unit tests for the split-payment math — technical plan §8's "put test
 * coverage first on payment-split math and category-approval logic" call.
 * Prisma is mocked; $transaction just invokes its callback with the same
 * mock (the transaction client has the same shape as PrismaService for
 * every method these tests touch).
 */
function buildPrismaMock() {
  const prisma: any = {
    listing: { findMany: jest.fn(), update: jest.fn() },
    fundraisingOrganisation: { findUnique: jest.fn() },
    order: { create: jest.fn() },
    paymentSplit: { createMany: jest.fn() },
    supplierWallet: { upsert: jest.fn() },
    walletTransaction: { create: jest.fn() },
    feedItForwardLedgerEntry: { create: jest.fn() },
    fundraisingLedgerEntry: { create: jest.fn() },
  };
  prisma.$transaction = jest.fn((cb: (tx: any) => Promise<any>) => cb(prisma));
  return prisma;
}

function listing(overrides: Partial<any> = {}) {
  return {
    id: 'listing-1',
    title: 'Vegetable box',
    supplierId: 'supplier-1',
    discountedPrice: 180,
    quantityAvailable: 10,
    status: 'active',
    supplier: { tier: 'farmer' },
    ...overrides,
  };
}

describe('OrdersService.checkout', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: OrdersService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new OrdersService(prisma, new CommissionService());
    prisma.order.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'order-1', ...data }));
  });

  it('rejects an empty basket', async () => {
    await expect(service.checkout('customer-1', { items: [] } as any)).rejects.toThrow(BadRequestException);
  });

  it('rejects when a listing no longer exists or is inactive', async () => {
    prisma.listing.findMany.mockResolvedValue([]); // requested 1, found 0
    await expect(
      service.checkout('customer-1', { items: [{ listingId: 'listing-1', quantity: 1 }] } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects when requested quantity exceeds stock', async () => {
    prisma.listing.findMany.mockResolvedValue([listing({ quantityAvailable: 1 })]);
    await expect(
      service.checkout('customer-1', { items: [{ listingId: 'listing-1', quantity: 5 }] } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an unknown fundraising code', async () => {
    prisma.listing.findMany.mockResolvedValue([listing()]);
    prisma.fundraisingOrganisation.findUnique.mockResolvedValue(null);
    await expect(
      service.checkout('customer-1', {
        items: [{ listingId: 'listing-1', quantity: 1 }],
        fundraisingCode: 'NOPE',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('splits a multi-supplier basket by tier commission — the R380 worked example', async () => {
    // Vegetable box R180 (farmer, 9%), raw honey R120 (local_business,
    // 12.5%), flour R80 (community_seller, 11%) — the same three-supplier
    // example from the proposal and feature spec §11.
    prisma.listing.findMany.mockResolvedValue([
      listing({ id: 'veg', discountedPrice: 180, supplierId: 'farmer-sup', supplier: { tier: 'farmer' } }),
      listing({ id: 'honey', discountedPrice: 120, supplierId: 'biz-sup', supplier: { tier: 'local_business' } }),
      listing({ id: 'flour', discountedPrice: 80, supplierId: 'comm-sup', supplier: { tier: 'community_seller' } }),
    ]);

    const result = await service.checkout('customer-1', {
      items: [
        { listingId: 'veg', quantity: 1 },
        { listingId: 'honey', quantity: 1 },
        { listingId: 'flour', quantity: 1 },
      ],
    } as any);

    const bySupplier = (id: string) => result.splits.find((s: any) => s.recipientId === id)?.amount;
    expect(bySupplier('farmer-sup')).toBeCloseTo(180 - 180 * 0.09, 2);
    expect(bySupplier('biz-sup')).toBeCloseTo(120 - 120 * 0.125, 2);
    expect(bySupplier('comm-sup')).toBeCloseTo(80 - 80 * 0.11, 2);

    const commission = result.splits.find((s: any) => s.recipientType === 'findi_commission');
    const totalCommission = 180 * 0.09 + 120 * 0.125 + 80 * 0.11;
    expect(commission).toBeDefined();
    expect(commission?.amount).toBeCloseTo(totalCommission, 2);

    // Order total charged to the customer is the subtotal — no Feed It
    // Forward/Fundraising selected in this basket.
    expect(prisma.order.create.mock.calls[0][0].data.subtotal).toBeCloseTo(380, 2);
  });

  it('computes round-up Feed It Forward to the nearest R10', async () => {
    prisma.listing.findMany.mockResolvedValue([listing({ discountedPrice: 287.5 })]);

    await service.checkout('customer-1', {
      items: [{ listingId: 'listing-1', quantity: 1 }],
      feedItForward: { mode: 'round_up' },
    } as any);

    const splitRows = (await prisma.paymentSplit.createMany.mock.calls[0][0]).data;
    const fif = splitRows.find((s: any) => s.recipientType === 'feed_it_forward');
    expect(fif.amount).toBeCloseTo(2.5, 2); // 287.50 -> 290
  });

  it('adds a fixed Feed It Forward amount when selected', async () => {
    prisma.listing.findMany.mockResolvedValue([listing({ discountedPrice: 100 })]);

    await service.checkout('customer-1', {
      items: [{ listingId: 'listing-1', quantity: 1 }],
      feedItForward: { mode: 'fixed', amount: 5 },
    } as any);

    const splitRows = prisma.paymentSplit.createMany.mock.calls[0][0].data;
    const fif = splitRows.find((s: any) => s.recipientType === 'feed_it_forward');
    expect(fif.amount).toBe(5);
  });

  it('funds a Fundraising allocation from commission, never from the supplier share', async () => {
    prisma.listing.findMany.mockResolvedValue([listing({ discountedPrice: 100 })]);
    prisma.fundraisingOrganisation.findUnique.mockResolvedValue({ id: 'org-1', code: 'SCHOOL1' });

    await service.checkout('customer-1', {
      items: [{ listingId: 'listing-1', quantity: 1 }],
      fundraisingCode: 'SCHOOL1',
    } as any);

    const splitRows = prisma.paymentSplit.createMany.mock.calls[0][0].data;
    const supplierRow = splitRows.find((s: any) => s.recipientType === 'supplier');
    const commissionRow = splitRows.find((s: any) => s.recipientType === 'findi_commission');
    const fundraisingRow = splitRows.find((s: any) => s.recipientType === 'fundraising_org');

    const totalCommission = 100 * 0.09; // farmer tier by default in listing()
    expect(supplierRow.amount).toBeCloseTo(100 - totalCommission, 2); // untouched by the fundraising split
    expect(fundraisingRow.amount).toBeCloseTo(totalCommission * 0.5, 2);
    expect(commissionRow.amount).toBeCloseTo(totalCommission * 0.5, 2);
    expect(fundraisingRow.recipientId).toBe('org-1');
  });

  it('aggregates two items from the same supplier into one payment split row', async () => {
    prisma.listing.findMany.mockResolvedValue([
      listing({ id: 'a', discountedPrice: 50, supplierId: 'same-sup' }),
      listing({ id: 'b', discountedPrice: 30, supplierId: 'same-sup' }),
    ]);

    await service.checkout('customer-1', {
      items: [
        { listingId: 'a', quantity: 1 },
        { listingId: 'b', quantity: 1 },
      ],
    } as any);

    const splitRows = prisma.paymentSplit.createMany.mock.calls[0][0].data;
    const supplierRows = splitRows.filter((s: any) => s.recipientType === 'supplier');
    expect(supplierRows).toHaveLength(1);
    expect(supplierRows[0].amount).toBeCloseTo(80 - 80 * 0.09, 2);
  });
});
