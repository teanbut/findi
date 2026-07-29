import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { ApplyDto } from './dto/apply.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Post('apply')
  apply(@Req() req: any, @Body() dto: ApplyDto) {
    return this.suppliers.apply(req.user.sub, dto);
  }

  @Post(':id/categories/:categoryId/request')
  requestCategory(@Param('id') id: string, @Param('categoryId') categoryId: string) {
    return this.suppliers.requestAdditionalCategory(id, categoryId);
  }

  // Admin-only routes — TODO: guard with an AdminGuard once the role-based
  // middleware from technical plan §5 is wired up.
  @Post(':id/approve')
  approveSupplier(@Param('id') id: string, @Req() req: any) {
    return this.suppliers.approveSupplier(id, req.user.sub);
  }

  @Post(':id/categories/:categoryId/approve')
  approveCategory(@Param('id') id: string, @Param('categoryId') categoryId: string, @Req() req: any) {
    return this.suppliers.approveCategory(id, categoryId, req.user.sub);
  }
}
