import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailAccountService } from './mail-account.service';
import { CpanelService } from './cpanel.service';
import { MailboxService } from './mailbox.service';

@Module({
  controllers: [MailController],
  providers: [MailAccountService, CpanelService, MailboxService],
})
export class MailModule {}
