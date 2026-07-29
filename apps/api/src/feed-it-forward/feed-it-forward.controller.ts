import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeedItForwardService } from './feed-it-forward.service';
import { Roles } from '../auth/decorators/roles.decorator';

// Ring-fenced ledger — admin-only end to end (feature spec §6.4/§6.6:
// disbursement needs a recorded approver, and the ledger view itself
// shouldn't be public any more than a bank statement would be).
@Roles('admin')
@Controller('feed-it-forward')
export class FeedItForwardController {
  constructor(private readonly feedItForward: FeedItForwardService) {}

  @Get('ledger')
  ledger() {
    return this.feedItForward.ledgerTotal();
  }

  @Post('disbursements')
  disburse(@Body() body: { recipient: string; amount: number; approvedBy: string; note?: string }) {
    return this.feedItForward.disburse(body.recipient, body.amount, body.approvedBy, body.note);
  }
}
