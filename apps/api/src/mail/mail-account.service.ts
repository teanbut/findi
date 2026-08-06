import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CpanelService } from './cpanel.service';
import { MailboxService } from './mailbox.service';
import { decryptSecret, encryptSecret } from './encryption.util';

const FINDI_MAIL_DOMAIN = 'findi.co.za';

// Findi's record of which findi.co.za mailboxes exist, fronting two
// external systems: cPanel (provisioning — create/delete the mailbox
// itself) and IMAP/SMTP (using that mailbox's own credentials, decrypted
// per-request, never held in memory longer than the request needs).
@Injectable()
export class MailAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cpanel: CpanelService,
    private readonly mailbox: MailboxService,
  ) {}

  list() {
    return this.prisma.mailAccount.findMany({
      select: { id: true, address: true, displayName: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(localPart: string, displayName: string | undefined, adminUserId: string) {
    const address = `${localPart}@${FINDI_MAIL_DOMAIN}`;
    const existing = await this.prisma.mailAccount.findUnique({ where: { address } });
    if (existing) throw new ConflictException(`${address} is already managed by Findi`);

    const password = randomBytes(24).toString('base64url');
    await this.cpanel.createMailbox(localPart, FINDI_MAIL_DOMAIN, password);

    return this.prisma.mailAccount.create({
      data: { address, displayName, encryptedPassword: encryptSecret(password), createdByAdminId: adminUserId },
      select: { id: true, address: true, displayName: true, active: true, createdAt: true },
    });
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOrThrow(id);
    const [localPart] = account.address.split('@');
    await this.cpanel.deleteMailbox(localPart, FINDI_MAIL_DOMAIN);
    await this.prisma.mailAccount.delete({ where: { id } });
  }

  async inbox(id: string, limit?: number) {
    return this.mailbox.listInbox(await this.credentialsFor(id), limit);
  }

  async message(id: string, uid: number) {
    return this.mailbox.readMessage(await this.credentialsFor(id), uid);
  }

  async send(id: string, to: string, subject: string, text: string): Promise<void> {
    await this.mailbox.send(await this.credentialsFor(id), to, subject, text);
  }

  private async findOrThrow(id: string) {
    const account = await this.prisma.mailAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Mailbox not found');
    return account;
  }

  private async credentialsFor(id: string) {
    const account = await this.findOrThrow(id);
    return { address: account.address, password: decryptSecret(account.encryptedPassword) };
  }
}
