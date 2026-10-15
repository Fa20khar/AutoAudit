import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name?: string;
  role: 'superadmin' | 'staff_admin' | 'fulfillment_specialist';
  iat?: number;
  exp?: number;
}

// In-memory runtime fallback secret if JWT_SECRET is not supplied in env
let runtimeSecret: string | null = null;

export function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }

  if (!runtimeSecret) {
    // Generate a secure 32-byte cryptographic secret for this runtime session
    runtimeSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠️  [Security Warning] JWT_SECRET is not configured in .env. Generated a secure ephemeral 256-bit runtime secret. For persistent sessions across server reboots, define JWT_SECRET in your .env or hosting environment variables.'
    );
  }

  return runtimeSecret;
}

/**
 * Sign an administrative JWT token
 * @param user Admin user information to embed
 * @param expiresIn Token validity period (e.g. '8h', '24h')
 */
export function signAdminToken(
  user: { id: string; email: string; name?: string; role?: string },
  expiresIn = '8h'
): string {
  const secret = getJwtSecret();
  const payload: AdminJwtPayload = {
    sub: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name || 'AutoAudit Administrator',
    role: (user.role as any) || 'staff_admin'
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
    issuer: 'AutoAudit-Auth-Engine',
    audience: 'autoaudit-admin-console'
  } as jwt.SignOptions);
}

/**
 * Synchronously verify and decode an administrative JWT token
 */
export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'AutoAudit-Auth-Engine',
      audience: 'autoaudit-admin-console'
    }) as AdminJwtPayload;

    return decoded;
  } catch (error: any) {
    // Return null on expired token, malformed signature, or tampering
    return null;
  }
}

/**
 * Hash a password using bcrypt with salt rounds = 12
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Synchronously or asynchronously compare a plain password with a bcrypt hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}
