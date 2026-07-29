import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { FundraisingService } from './fundraising.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { FundraisingOrgType } from '@findi/shared';

@Controller('fundraising')
export class FundraisingController {
  constructor(private readonly fundraising: FundraisingService) {}

  // Any authenticated fundraising_org-role user can apply — this creates
  // the FundraisingOrganisation itself (feature spec §7, decision #13).
  @Roles('fundraising_org')
  @Post('apply')
  apply(@Req() req: any, @Body() body: { name: string; type: FundraisingOrgType }) {
    return this.fundraising.apply(req.user.sub, body.name, body.type);
  }

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

  @Roles('admin')
  @Get('pending')
  pending() {
    return this.fundraising.pending();
  }

  @Roles('admin')
  @Post(':orgId/approve')
  approve(@Param('orgId') orgId: string, @Req() req: any) {
    return this.fundraising.approve(orgId, req.user.sub);
  }

  // TODO: GET /:orgId/reports (monthly exportable reports — feature spec §7)
}
