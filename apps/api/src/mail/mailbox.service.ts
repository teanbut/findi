import { Injectable } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';

export interface MailboxCredentials {
  address: string;
  password: string;
}

export interface InboxMessageSummary {
  uid: number;
  from: string;
  subject: string;
  date: Date;
  seen: boolean;
}

export interface MailMessageDetail {
  from: string;
  to: string;
  subject: string;
  date: Date;
  text: string;
  html?: string;
}

// IMAP (read) + SMTP (send) against one mailbox at a time, using the
// address's own credentials — never a shared/admin mail login. Findi's
// mail hosting is domains.co.za/cPanel (see FINDI_TECHNICAL_DESIGN_AND_IMPLEMENTATION_PLAN.md §14a).
@Injectable()
export class MailboxService {
  private imapConfig() {
    return {
      host: process.env.MAIL_HOST!,
      port: Number(process.env.MAIL_IMAP_PORT ?? 993),
      secure: (process.env.MAIL_TLS ?? 'true') === 'true',
    };
  }

  private smtpConfig() {
    return {
      host: process.env.MAIL_HOST!,
      port: Number(process.env.MAIL_SMTP_PORT ?? 465),
      secure: (process.env.MAIL_TLS ?? 'true') === 'true',
    };
  }

  async listInbox(creds: MailboxCredentials, limit = 25): Promise<InboxMessageSummary[]> {
    const client = new ImapFlow({
      ...this.imapConfig(),
      auth: { user: creds.address, pass: creds.password },
      logger: false,
    });
    await client.connect();
    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        const status = await client.status('INBOX', { messages: true });
        const total = status.messages ?? 0;
        if (total === 0) return [];

        const messages: InboxMessageSummary[] = [];
        const from = Math.max(1, total - limit + 1);
        for await (const msg of client.fetch(`${from}:${total}`, { envelope: true, flags: true })) {
          messages.push({
            uid: msg.uid,
            from: msg.envelope?.from?.[0]?.address ?? 'unknown',
            subject: msg.envelope?.subject ?? '(no subject)',
            date: msg.envelope?.date ?? new Date(0),
            seen: msg.flags?.has('\\Seen') ?? false,
          });
        }
        return messages.sort((a, b) => b.date.getTime() - a.date.getTime());
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async readMessage(creds: MailboxCredentials, uid: number): Promise<MailMessageDetail> {
    const client = new ImapFlow({
      ...this.imapConfig(),
      auth: { user: creds.address, pass: creds.password },
      logger: false,
    });
    await client.connect();
    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        const raw = await client.download(String(uid), undefined, { uid: true });
        const parsed = await simpleParser(raw.content);
        return {
          from: parsed.from?.text ?? 'unknown',
          to: parsed.to && 'text' in parsed.to ? parsed.to.text : '',
          subject: parsed.subject ?? '(no subject)',
          date: parsed.date ?? new Date(0),
          text: parsed.text ?? '',
          html: typeof parsed.html === 'string' ? parsed.html : undefined,
        };
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async send(creds: MailboxCredentials, to: string, subject: string, text: string): Promise<void> {
    const transport = nodemailer.createTransport({
      ...this.smtpConfig(),
      auth: { user: creds.address, pass: creds.password },
    });
    await transport.sendMail({ from: creds.address, to, subject, text });
  }
}
