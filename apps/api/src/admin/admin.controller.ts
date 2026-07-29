import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';

// Nothing in here is reachable by a supplier or customer token — enforced
// by RolesGuard reading this class-level decorator, not by convention.
@Roles('admin')
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
