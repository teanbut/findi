import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Feature spec §5.5 / §4.3 — "does this category already have enough
   * quality suppliers?" This is the operational read behind that question:
   * count of approved suppliers per category, for the admin capacity view
   * (technical plan §5, /admin group) to render alongside a pending
   * application before it's approved or declined.
   */
  async capacity(categoryId: string) {
    const approvedCount = await this.prisma.supplierCategory.count({
      where: { categoryId, status: 'approved' },
    });
    return { categoryId, approvedSupplierCount: approvedCount };
  }
}
