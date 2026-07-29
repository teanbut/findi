import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The enforcement point for feature spec §5.3 / §11.2: a supplier can only
   * create a listing in a category they hold an *approved* SupplierCategory
   * row for. This must live here, in the service, not just as a front-end
   * check — the whole curation promise depends on this being unbypassable.
   */
  async create(supplierId: string, dto: CreateListingDto) {
    const approval = await this.prisma.supplierCategory.findUnique({
      where: { supplierId_categoryId: { supplierId, categoryId: dto.categoryId } },
    });
    if (!approval || approval.status !== 'approved') {
      throw new ForbiddenException(
        'Not approved to list in this category yet — request category approval first',
      );
    }

    return this.prisma.listing.create({
      data: {
        supplierId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        photos: dto.photos,
        unit: dto.unit,
        originalPrice: dto.originalPrice,
        discountedPrice: dto.discountedPrice,
        quantityAvailable: dto.quantityAvailable,
        collectionWindowStart: new Date(dto.collectionWindowStart),
        collectionWindowEnd: new Date(dto.collectionWindowEnd),
        pickupAddress: dto.pickupAddress,
        status: 'active',
      },
    });
  }

  browse(filters: { categoryId?: string; supplierId?: string }) {
    return this.prisma.listing.findMany({
      where: { status: 'active', ...filters },
      include: { supplier: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // A supplier's own listings, any status (draft/active/paused) — unlike
  // browse() above, which is the public "active only" catalogue view.
  mine(supplierId: string) {
    return this.prisma.listing.findMany({
      where: { supplierId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { supplier: { include: { approvedSellerScore: true } }, category: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  pause(id: string, supplierId: string) {
    return this.prisma.listing.updateMany({
      where: { id, supplierId },
      data: { status: 'paused' },
    });
  }
}
