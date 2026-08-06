import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { MailAccountService } from './mail-account.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMailAccountDto } from './dto/create-mail-account.dto';
import { SendMailDto } from './dto/send-mail.dto';

// Nothing in here is reachable by a supplier or customer token — same
// pattern as AdminController (class-level @Roles guard, not per-route).
@Roles('admin')
@Controller('admin/mail')
export class MailController {
  constructor(private readonly mailAccounts: MailAccountService) {}

  @Get('accounts')
  list() {
    return this.mailAccounts.list();
  }

  @Post('accounts')
  create(@Body() dto: CreateMailAccountDto, @Req() req: any) {
    return this.mailAccounts.create(dto.localPart, dto.displayName, req.user.sub);
  }

  @Delete('accounts/:id')
  remove(@Param('id') id: string) {
    return this.mailAccounts.remove(id);
  }

  @Get('accounts/:id/inbox')
  inbox(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.mailAccounts.inbox(id, limit ? Number(limit) : undefined);
  }

  @Get('accounts/:id/inbox/:uid')
  message(@Param('id') id: string, @Param('uid') uid: string) {
    return this.mailAccounts.message(id, Number(uid));
  }

  @Post('accounts/:id/send')
  send(@Param('id') id: string, @Body() dto: SendMailDto) {
    return this.mailAccounts.send(id, dto.to, dto.subject, dto.text);
  }
}
