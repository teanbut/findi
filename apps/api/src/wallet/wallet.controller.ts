import { Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get(':supplierId')
  balance(@Param('supplierId') supplierId: string) {
    return this.wallet.getBalance(supplierId);
  }

  @Get(':supplierId/statement')
  statement(@Param('supplierId') supplierId: string) {
    return this.wallet.statement(supplierId);
  }

  // Admin/cron-triggered — not a general-purpose endpoint long-term.
  @Post('run-weekly-payout')
  runPayout() {
    return this.wallet.runWeeklyPayout();
  }
}
