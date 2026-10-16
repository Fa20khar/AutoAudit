/**
 * RFC 6238 Time-based One-Time Password (TOTP) & RFC 4226 HOTP Engine
 * Standard 6-digit TOTP with HMAC-SHA1 and 30-second window.
 * Fully compliant with Google Authenticator, Microsoft Authenticator, 1Password, and Apple Passwords.
 */

import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to RFC 4648 Base32 string (without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string into a Buffer
 */
export function base32Decode(base32String: string): Buffer {
  const cleanInput = base32String.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const index = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (index === -1) {
      continue; // Skip invalid characters safely
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random Base32 secret for TOTP (typically 20 bytes -> 32 characters)
 */
export function generateTotpSecret(numBytes = 20): string {
  const randomBuffer = crypto.randomBytes(numBytes);
  return base32Encode(randomBuffer);
}

/**
 * Generates the 6-digit TOTP code for a given counter value using HMAC-SHA1 (RFC 4226)
 */
function generateHotp(keyBuffer: Buffer, counter: number, digits = 6): string {
  const counterBuffer = Buffer.alloc(8);
  // Write counter as 64-bit big-endian integer
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Generates the current TOTP code for a Base32 secret
 */
export function generateTotp(
  secretBase32: string,
  timeStepSeconds = 30,
  digits = 6,
  timestampMs = Date.now()
): string {
  const keyBuffer = base32Decode(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / timeStepSeconds);
  return generateHotp(keyBuffer, counter, digits);
}

/**
 * Verifies a submitted 6-digit TOTP code against a Base32 secret.
 * Allows a default clock drift window of ±1 step (±30 seconds)
 */
export function verifyTotp(
  token: string,
  secretBase32: string,
  options?: { window?: number; timeStepSeconds?: number; timestampMs?: number }
): boolean {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  const keyBuffer = base32Decode(secretBase32);
  if (keyBuffer.length === 0) return false;

  const window = options?.window ?? 1; // ±1 step window (tolerates ±30s clock drift)
  const timeStepSeconds = options?.timeStepSeconds ?? 30;
  const timestampMs = options?.timestampMs ?? Date.now();
  const currentCounter = Math.floor(timestampMs / 1000 / timeStepSeconds);

  for (let offset = -window; offset <= window; offset++) {
    const expectedOtp = generateHotp(keyBuffer, currentCounter + offset, 6);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedOtp))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an otpauth:// URI for scanning with authenticator apps (Google Authenticator, etc.)
 */
export function generateOtpAuthUrl(options: {
  secret: string;
  email: string;
  issuer?: string;
}): string {
  const issuer = options.issuer || 'AutoAudit';
  const label = `${issuer}:${options.email.trim()}`;
  const encodedLabel = encodeURIComponent(label);
  const encodedIssuer = encodeURIComponent(issuer);
  const cleanSecret = options.secret.toUpperCase().replace(/[\s=-]/g, '');

  return `otpauth://totp/${encodedLabel}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates random 8-character backup codes for emergency recovery
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}
