import { Controller, Get, Param } from '@nestjs/common';
import { FundraisingService } from './fundraising.service';

@Controller('fundraising')
export class FundraisingController {
  constructor(private readonly fundraising: FundraisingService) {}

  @Get(':orgId/dashboard')
  dashboard(@Param('orgId') orgId: string) {
    return this.fundraising.dashboard(orgId);
  }

  // TODO: POST /fundraising/apply (org registration), GET /:orgId/reports
  // (monthly exportable reports — feature spec §7), admin approve/reject.
}
