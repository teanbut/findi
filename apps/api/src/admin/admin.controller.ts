import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';

// Nothing in here is reachable by a supplier or customer token — enforced
// by RolesGuard reading this class-level decorator, not by convention.
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('orders')
  orders() {
    return this.admin.orders();
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.admin.getOrder(id);
  }

  @Post('orders/:id/cancel')
  cancelOrder(@Param('id') id: string, @Req() req: any, @Body() body: { reason: string }) {
    return this.admin.cancelOrder(id, req.user.sub, body.reason);
  }

  @Get('suppliers/pending')
  pendingSuppliers() {
    return this.admin.pendingSuppliers();
  }

  @Get('categories/pending-requests')
  pendingCategoryRequests() {
    return this.admin.pendingCategoryRequests();
  }

  @Get('revenue')
  revenue(@Query('from') from: string, @Query('to') to: string) {
    return this.admin.revenue(new Date(from), new Date(to));
  }

  @Get('audit-log')
  auditLog(@Query('entity') entity?: string) {
    return this.admin.auditLog(entity);
  }
}
