import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  // "Me" routes, not a trusted :supplierId param — a supplier can only
  // ever see their own wallet through this endpoint.
  @Roles('supplier')
  @Get('me')
  myBalance(@Req() req: any) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.wallet.getBalance(req.user.supplierId);
  }

  @Roles('supplier')
  @Get('me/statement')
  myStatement(@Req() req: any) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.wallet.statement(req.user.supplierId);
  }

  @Roles('supplier')
  @Post('me/withdraw')
  withdraw(@Req() req: any, @Body() body: { amount: number }) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.wallet.withdraw(req.user.supplierId, body.amount);
  }

  // Admin override — support/dispute investigation needs to see any
  // supplier's wallet (feature spec §12).
  @Roles('admin')
  @Get(':supplierId')
  balance(@Param('supplierId') supplierId: string) {
    return this.wallet.getBalance(supplierId);
  }

  @Roles('admin')
  @Get(':supplierId/statement')
  statement(@Param('supplierId') supplierId: string) {
    return this.wallet.statement(supplierId);
  }

  // Admin/cron-triggered — not a general-purpose endpoint long-term; the
  // real trigger should be the BullMQ scheduler (technical plan §4.4),
  // this stays admin-gated as a manual/testing entry point until then.
  @Roles('admin')
  @Post('run-weekly-payout')
  runPayout() {
    return this.wallet.runWeeklyPayout();
  }
}
