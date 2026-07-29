import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

// TODO: guard this whole controller with an AdminGuard (role === 'admin')
// once the auth middleware from technical plan §5 is wired up — nothing
// here should be reachable by a supplier or customer token.
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

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
