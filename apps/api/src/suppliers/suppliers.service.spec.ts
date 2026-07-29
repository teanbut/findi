import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

/**
 * Feature spec §5.2 stage 4 ("Login Activated"): portal access requires
 * BOTH an approved profile AND at least one approved category. This is
 * the exact check every supplier-side route depends on, so it's tested
 * directly against every combination rather than just the happy path.
 */
function buildPrismaMock() {
  return {
    supplierProfile: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    supplierCategory: { update: jest.fn(), create: jest.fn() },
    auditLogEntry: { create: jest.fn() },
  } as any;
}

describe('SuppliersService.assertCanAccessPortal', () => {
  it('denies access when the supplier does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierProfile.findUnique.mockResolvedValue(null);
    const service = new SuppliersService(prisma);

    await expect(service.assertCanAccessPortal('nope')).rejects.toThrow(NotFoundException);
  });

  it('denies access when the profile is still pending, even with an approved category', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierProfile.findUnique.mockResolvedValue({ status: 'pending', categories: [{ status: 'approved' }] });
    const service = new SuppliersService(prisma);

    await expect(service.assertCanAccessPortal('supplier-1')).rejects.toThrow(ForbiddenException);
  });

  it('denies access when the profile is approved but zero categories are approved', async () => {
    const prisma = buildPrismaMock();
    // The query already filters categories to status:'approved', so an
    // empty array here means "profile approved, nothing else is."
    prisma.supplierProfile.findUnique.mockResolvedValue({ status: 'approved', categories: [] });
    const service = new SuppliersService(prisma);

    await expect(service.assertCanAccessPortal('supplier-1')).rejects.toThrow(ForbiddenException);
  });

  it('grants access once both the profile and at least one category are approved', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierProfile.findUnique.mockResolvedValue({
      status: 'approved',
      categories: [{ status: 'approved' }],
    });
    const service = new SuppliersService(prisma);

    await expect(service.assertCanAccessPortal('supplier-1')).resolves.toBeDefined();
  });
});

describe('SuppliersService approval pipeline', () => {
  it('approving the profile does not touch any SupplierCategory row', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierProfile.update.mockResolvedValue({ id: 'supplier-1', status: 'approved' });
    const service = new SuppliersService(prisma);

    await service.approveSupplier('supplier-1', 'admin-1');

    expect(prisma.supplierProfile.update).toHaveBeenCalledWith({
      where: { id: 'supplier-1' },
      data: { status: 'approved' },
    });
    expect(prisma.supplierCategory.update).not.toHaveBeenCalled();
  });

  it('approving a category is scoped to exactly that supplier + category pair', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierCategory.update.mockResolvedValue({ status: 'approved' });
    const service = new SuppliersService(prisma);

    await service.approveCategory('supplier-1', 'honey', 'admin-1');

    expect(prisma.supplierCategory.update).toHaveBeenCalledWith({
      where: { supplierId_categoryId: { supplierId: 'supplier-1', categoryId: 'honey' } },
      data: expect.objectContaining({ status: 'approved' }),
    });
  });

  it('a category-add request is created as pending, not auto-approved', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierCategory.create.mockResolvedValue({ status: 'pending' });
    const service = new SuppliersService(prisma);

    await service.requestAdditionalCategory('supplier-1', 'olive-oil');

    expect(prisma.supplierCategory.create).toHaveBeenCalledWith({
      data: { supplierId: 'supplier-1', categoryId: 'olive-oil', status: 'pending' },
    });
  });

  it('every approval action writes an audit log entry', async () => {
    const prisma = buildPrismaMock();
    prisma.supplierProfile.update.mockResolvedValue({ id: 'supplier-1' });
    prisma.supplierCategory.update.mockResolvedValue({});
    const service = new SuppliersService(prisma);

    await service.approveSupplier('supplier-1', 'admin-1');
    await service.approveCategory('supplier-1', 'honey', 'admin-1');

    expect(prisma.auditLogEntry.create).toHaveBeenCalledTimes(2);
  });
});
