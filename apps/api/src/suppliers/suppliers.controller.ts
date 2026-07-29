import { Body, Controller, ForbiddenException, Param, Post, Req } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { ApplyDto } from './dto/apply.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  // Any authenticated user can apply — this IS how a 'supplier'-role user
  // gets their first SupplierProfile, so no @Roles() narrowing here.
  @Post('apply')
  apply(@Req() req: any, @Body() dto: ApplyDto) {
    return this.suppliers.apply(req.user.sub, dto);
  }

  // A supplier requests a category for THEIR OWN account — req.user.supplierId
  // (set by JwtAuthGuard), never a URL param, or any supplier could request
  // categories onto another supplier's profile.
  @Roles('supplier')
  @Post('categories/:categoryId/request')
  requestCategory(@Req() req: any, @Param('categoryId') categoryId: string) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.suppliers.requestAdditionalCategory(req.user.supplierId, categoryId);
  }

  @Roles('admin')
  @Post(':id/approve')
  approveSupplier(@Param('id') id: string, @Req() req: any) {
    return this.suppliers.approveSupplier(id, req.user.sub);
  }

  @Roles('admin')
  @Post(':id/categories/:categoryId/approve')
  approveCategory(@Param('id') id: string, @Param('categoryId') categoryId: string, @Req() req: any) {
    return this.suppliers.approveCategory(id, categoryId, req.user.sub);
  }
}
