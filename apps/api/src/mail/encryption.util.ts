import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Mailbox passwords (MailAccount.encryptedPassword) are the only thing this
// encrypts — never used for anything that needs to be queried or indexed.
function getKey(): Buffer {
  const hex = process.env.MAIL_ENCRYPTION_KEY;
  if (!hex) throw new Error('MAIL_ENCRYPTION_KEY is not set');
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw new Error('MAIL_ENCRYPTION_KEY must be a 32-byte key (64 hex chars) — generate with `openssl rand -hex 32`');
  return key;
}

// Payload layout: base64(iv) . base64(authTag) . base64(ciphertext)
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted mailbox password payload');
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
