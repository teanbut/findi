import { Injectable } from '@nestjs/common';

interface UapiResult<T> {
  status: number; // 1 = success, 0 = failure
  errors: string[] | null;
  data: T;
}

// Talks to the cPanel hosting account behind findi.co.za's mailboxes
// (domains.co.za) — a control-plane API, distinct from IMAP/SMTP against
// an individual mailbox (see MailboxService). Used only for provisioning:
// creating/deleting the mailbox itself, not reading/sending mail.
@Injectable()
export class CpanelService {
  private get baseUrl(): string {
    const host = process.env.MAIL_CPANEL_HOST;
    const port = process.env.MAIL_CPANEL_PORT ?? '2083';
    if (!host) throw new Error('MAIL_CPANEL_HOST is not set');
    return `https://${host}:${port}/execute`;
  }

  private get authHeader(): string {
    const user = process.env.MAIL_CPANEL_USERNAME;
    const pass = process.env.MAIL_CPANEL_PASSWORD;
    if (!user || !pass) throw new Error('MAIL_CPANEL_USERNAME / MAIL_CPANEL_PASSWORD are not set');
    return `cpanel ${user}:${pass}`;
  }

  private async call<T = unknown>(module: string, fn: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${module}/${fn}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const res = await fetch(url, { headers: { Authorization: this.authHeader } });
    if (!res.ok) {
      throw new Error(`cPanel UAPI ${module}::${fn} failed with HTTP ${res.status} — check MAIL_CPANEL_* credentials`);
    }
    const body = (await res.json()) as UapiResult<T>;
    if (body.status !== 1) {
      throw new Error(`cPanel UAPI ${module}::${fn} error: ${(body.errors ?? ['unknown']).join('; ')}`);
    }
    return body.data;
  }

  createMailbox(localPart: string, domain: string, password: string, quotaMb = 1024) {
    return this.call('Email', 'add_pop', { email: localPart, domain, password, quota: String(quotaMb) });
  }

  deleteMailbox(localPart: string, domain: string) {
    return this.call('Email', 'delete_pop', { email: localPart, domain });
  }
}
