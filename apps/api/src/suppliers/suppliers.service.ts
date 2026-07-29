import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyDto } from './dto/apply.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stage 1 of the pipeline (feature spec §5.2): Application → Pending Review.
   * Creates the SupplierProfile plus one SupplierCategory row per requested
   * category, all `pending` — nothing is usable yet.
   */
  async apply(userId: string, dto: ApplyDto) {
    return this.prisma.supplierProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        tier: dto.tier,
        status: 'pending',
        categories: {
          create: dto.categoryIds.map((categoryId) => ({ categoryId, status: 'pending' as const })),
        },
      },
      include: { categories: true },
    });
  }

  /**
   * Stage 2+3 (Approved → Categories Assigned), admin-only action.
   * Approving the supplier and approving a category are deliberately two
   * separate writes — approving the profile does NOT implicitly approve
   * every requested category (feature spec §5.3: "not free to list anything").
   */
  async approveSupplier(supplierId: string, actorId: string) {
    const supplier = await this.prisma.supplierProfile.update({
      where: { id: supplierId },
      data: { status: 'approved' },
    });
    await this.prisma.auditLogEntry.create({
      data: { actorId, action: 'supplier.approve', entity: 'SupplierProfile', entityId: supplierId },
    });
    return supplier;
  }

  async approveCategory(supplierId: string, categoryId: string, actorId: string) {
    // TODO: before approving, check CategoriesService.capacity(categoryId)
    // against the business's category-capacity threshold (feature spec §5.5,
    // decision #7) — the admin UI shows this, but it should be enforced
    // here too, not just in the UI.
    const row = await this.prisma.supplierCategory.update({
      where: { supplierId_categoryId: { supplierId, categoryId } },
      data: { status: 'approved', approvedAt: new Date() },
    });
    await this.prisma.auditLogEntry.create({
      data: { actorId, action: 'supplier.category.approve', entity: 'SupplierCategory', entityId: `${supplierId}:${categoryId}` },
    });
    return row;
  }

  /**
   * Stage 4 (Login Activated) — feature spec §5.2 requires BOTH the profile
   * being approved AND at least one approved category before portal access
   * opens. This is the check every supplier-side route should call.
   */
  async assertCanAccessPortal(supplierId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      include: { categories: { where: { status: 'approved' } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.status !== 'approved' || supplier.categories.length === 0) {
      throw new ForbiddenException('Supplier is not yet fully approved for any category');
    }
    return supplier;
  }

  /**
   * Feature spec §5.3/§11.2 — an active supplier requesting an additional
   * category. Goes back through the same review as a first-time applicant,
   * not a self-service toggle: created as `pending`.
   */
  async requestAdditionalCategory(supplierId: string, categoryId: string) {
    return this.prisma.supplierCategory.create({
      data: { supplierId, categoryId, status: 'pending' },
    });
  }
}
