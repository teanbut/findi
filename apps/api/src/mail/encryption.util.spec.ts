import { randomBytes } from 'crypto';
import { decryptSecret, encryptSecret } from './encryption.util';

// Mailbox passwords (MailAccount.encryptedPassword) are the only secret
// this protects — a round-trip bug here would mean a mailbox is either
// unreadable or, worse, silently storing something that decrypts wrong.
describe('mail encryption', () => {
  const originalKey = process.env.MAIL_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.MAIL_ENCRYPTION_KEY = randomBytes(32).toString('hex');
  });

  afterAll(() => {
    process.env.MAIL_ENCRYPTION_KEY = originalKey;
  });

  it('round-trips a mailbox password', () => {
    const password = "g-up5sRFg/OJWEPQqgMm.1,Nh,Ln,7,pm.-..odJ9mnU_W8N";
    expect(decryptSecret(encryptSecret(password))).toBe(password);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const password = 'same-password';
    expect(encryptSecret(password)).not.toBe(encryptSecret(password));
  });

  it('fails closed if MAIL_ENCRYPTION_KEY is missing', () => {
    delete process.env.MAIL_ENCRYPTION_KEY;
    expect(() => encryptSecret('anything')).toThrow('MAIL_ENCRYPTION_KEY is not set');
  });

  it('rejects a key of the wrong length', () => {
    process.env.MAIL_ENCRYPTION_KEY = 'tooshort';
    expect(() => encryptSecret('anything')).toThrow('32-byte key');
  });

  it('rejects a payload tampered with after encryption', () => {
    const ciphertext = encryptSecret('sensitive');
    const [iv, tag, data] = ciphertext.split('.');
    const tampered = [iv, tag, Buffer.from('tampered').toString('base64')].join('.');
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
