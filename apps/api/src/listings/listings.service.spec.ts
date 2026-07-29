import { ForbiddenException } from '@nestjs/common';
import { ListingsService } from './listings.service';

/**
 * Feature spec §5.3: "not free to list anything." This is the whole
 * curation promise resting on one enforcement point — worth testing
 * directly rather than trusting it stays correct through future edits.
 */
function buildPrismaMock() {
  return {
    supplierCategory: { findUnique: jest.fn() },
    listing: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  } as any;
}

function createDto() {
  return {
    categoryId: 'honey',
    title: 'Raw Cape Honey 500g',
    description: 'Local raw honey',
    photos: [],
    unit: 'jar',
    originalPrice: 90,
    discountedPrice: 65,
    quantityAvailable: 20,
    collectionWindowStart: '2026-08-01T16:00:00.000Z',
    collectionWindowEnd: '2026-08-01T18:00:00.000Z',
    pickupAddress: '1 Main Rd, Cape Town',
  };
}

describe('ListingsService.create', () => {
  it('refuses to create a listing in a category with no approval on record', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierCategory.findUnique.mockResolvedValue(null);
    const service = new ListingsService(prisma);

    await expect(service.create('supplier-1', createDto())).rejects.toThrow(ForbiddenException);
    expect(prisma.listing.create).not.toHaveBeenCalled();
  });

  it('refuses to create a listing in a category that is still pending', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierCategory.findUnique.mockResolvedValue({ status: 'pending' });
    const service = new ListingsService(prisma);

    await expect(service.create('supplier-1', createDto())).rejects.toThrow(ForbiddenException);
    expect(prisma.listing.create).not.toHaveBeenCalled();
  });

  it('allows creation once the category is approved for that supplier', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierCategory.findUnique.mockResolvedValue({ status: 'approved' });
    prisma.listing.create.mockResolvedValue({ id: 'new-listing' });
    const service = new ListingsService(prisma);

    const result = await service.create('supplier-1', createDto());

    expect(result).toEqual({ id: 'new-listing' });
    expect(prisma.listing.create).toHaveBeenCalledTimes(1);
    expect(prisma.supplierCategory.findUnique).toHaveBeenCalledWith({
      where: { supplierId_categoryId: { supplierId: 'supplier-1', categoryId: 'honey' } },
    });
  });

  it('never lets one supplier list under an approval belonging to another', async () => {
    // The lookup is keyed on (supplierId, categoryId) together — an approval
    // for supplier-1 must never satisfy a create() call from supplier-2.
    const prisma = buildPrismaMock();
    prisma.supplierCategory.findUnique.mockImplementation(({ where }: any) =>
      where.supplierId_categoryId.supplierId === 'supplier-1' ? { status: 'approved' } : null,
    );
    const service = new ListingsService(prisma);

    await expect(service.create('supplier-2', createDto())).rejects.toThrow(ForbiddenException);
  });
});
