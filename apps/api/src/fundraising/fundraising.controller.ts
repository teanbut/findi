import { Controller, ForbiddenException, Get, Param, Req } from '@nestjs/common';
import { FundraisingService } from './fundraising.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('fundraising')
export class FundraisingController {
  constructor(private readonly fundraising: FundraisingService) {}

  // An org sees only its own dashboard — req.user.orgId (set by
  // JwtAuthGuard), never a URL param.
  @Roles('fundraising_org')
  @Get('me/dashboard')
  myDashboard(@Req() req: any) {
    if (!req.user.orgId) throw new ForbiddenException('No fundraising organisation on this account yet');
    return this.fundraising.dashboard(req.user.orgId);
  }

  // Admin override for support/reporting.
  @Roles('admin')
  @Get(':orgId/dashboard')
  dashboard(@Param('orgId') orgId: string) {
    return this.fundraising.dashboard(orgId);
  }

  // TODO: POST /fundraising/apply (org registration), GET /:orgId/reports
  // (monthly exportable reports — feature spec §7), admin approve/reject.
}
