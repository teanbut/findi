// One-off backfill for the two findi.co.za mailboxes created manually in
// cPanel before the portal could provision its own (info@, melanie@ —
// 2026-08-04). New mailboxes going forward go through MailAccountService.create()
// instead, which also calls cPanel. Safe to re-run — skips addresses already present.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const { createCipheriv, randomBytes } = require('crypto');

function encryptSecret(plaintext) {
  const key = Buffer.from(process.env.MAIL_ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) throw new Error('MAIL_ENCRYPTION_KEY must be a 32-byte key (64 hex chars)');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

const prisma = new PrismaClient();

const SEED_ACCOUNTS = [
  { address: process.env.MAIL_INFO_ADDRESS, password: process.env.MAIL_INFO_PASSWORD, displayName: 'Findi — General' },
  { address: process.env.MAIL_MELANIE_ADDRESS, password: process.env.MAIL_MELANIE_PASSWORD, displayName: 'Melanie' },
];

async function main() {
  for (const account of SEED_ACCOUNTS) {
    if (!account.address || !account.password) {
      console.warn(`Skipping ${account.displayName} — address/password missing from .env`);
      continue;
    }
    const existing = await prisma.mailAccount.findUnique({ where: { address: account.address } });
    if (existing) {
      console.log(`Already present: ${account.address}`);
      continue;
    }
    await prisma.mailAccount.create({
      data: {
        address: account.address,
        displayName: account.displayName,
        encryptedPassword: encryptSecret(account.password),
      },
    });
    console.log(`Seeded: ${account.address}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
