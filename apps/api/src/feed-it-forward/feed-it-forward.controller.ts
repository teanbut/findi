import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeedItForwardService } from './feed-it-forward.service';

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
