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

// In-memory runtime fallback secret if JWT_SECRET is not supplied in dev environment
let runtimeSecret: string | null = null;

/**
 * Retrieves the cryptographic secret used for signing and verifying JWT tokens.
 * In production, enforces an explicit JWT_SECRET of at least 32 characters.
 */
export function getJwtSecret(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const envSecret = process.env.JWT_SECRET;

  if (envSecret && envSecret.trim().length >= 32) {
    return envSecret.trim();
  }

  // In production, strictly fail fast: never fall back to ephemeral or hardcoded secret
  if (isProduction) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION ERROR: Production requires a strong JWT_SECRET (minimum 32 characters) configured in backend environment variables. The server will not start with an ephemeral or fallback key.'
    );
  }

  // If provided but too short (< 32 chars) in development, warn strongly
  if (envSecret && envSecret.trim().length < 32) {
    console.warn(
      '⚠️  [Security Warning] JWT_SECRET in environment variables is shorter than 32 characters. Using a cryptographically secure 256-bit runtime key instead.'
    );
  }

  if (!runtimeSecret) {
    // Generate a secure 256-bit (32-byte) cryptographic secret for this runtime session (dev only)
    runtimeSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '🛡️  [Security Alert] JWT_SECRET is not configured in backend environment. Generated an ephemeral 256-bit cryptographic secret for this runtime session. For persistent admin sessions across reboots, set JWT_SECRET in your Railway / hosting environment variables.'
    );
  }

  return runtimeSecret;
}

/**
 * Validates security configuration on server boot and logs diagnostics.
 * In production, throws an exception if JWT_SECRET is missing or less than 32 characters.
 */
export function validateSecurityOnStartup(): {
  jwtConfigured: boolean;
  setupSecretConfigured: boolean;
  isProduction: boolean;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtConfigured = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 32);
  const setupSecretConfigured = Boolean(process.env.ADMIN_SETUP_SECRET && process.env.ADMIN_SETUP_SECRET.trim().length >= 16);

  if (isProduction && !jwtConfigured) {
    throw new Error(
      'FATAL DEPLOYMENT ERROR: JWT_SECRET environment variable is missing or less than 32 characters in production. AutoAudit refuses to boot to prevent insecure ephemeral tokens.'
    );
  }

  console.log('----------------------------------------------------');
  console.log('🔒 AutoAudit Security Subsystem Initialized');
  console.log(`   Environment:             ${process.env.NODE_ENV || 'development'}`);
  console.log(`   JWT_SECRET:              ${jwtConfigured ? '✅ Configured (256+ bit key)' : '⚠️  Generated Ephemeral Key (Dev Only)'}`);
  console.log(`   ADMIN_SETUP_SECRET:      ${setupSecretConfigured ? '✅ Enabled for initial provisioning' : '⚪ Unset (Endpoint disabled)'}`);
  console.log('   Password Hashing:        ✅ bcrypt (12 salt rounds)');
  console.log('   Brute-force Limiter:     ✅ Active (5 attempts / 15m lock)');
  console.log('----------------------------------------------------');

  return { jwtConfigured, setupSecretConfigured, isProduction };
}

/**
 * Constant-time string comparison to prevent timing attacks on secrets
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to equalize timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Signs an administrative JWT token with an 8-hour expiration
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
 * Synchronously verifies and decodes an administrative JWT token
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
  } catch {
    // Return null on expired token, malformed signature, or tampering
    return null;
  }
}

export interface TwoFactorPreAuthPayload {
  sub: string;
  email: string;
  purpose: '2fa_login' | '2fa_setup';
  pendingSecret?: string;
  iat?: number;
  exp?: number;
}

/**
 * Signs a short-lived (10-minute) pre-authentication token for 2FA verification/setup
 */
export function sign2FAPreAuthToken(
  payload: { sub: string; email: string; purpose: '2fa_login' | '2fa_setup'; pendingSecret?: string },
  expiresIn = '10m'
): string {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      purpose: payload.purpose,
      pendingSecret: payload.pendingSecret
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn,
      issuer: 'AutoAudit-Auth-Engine',
      audience: 'autoaudit-2fa-preauth'
    } as jwt.SignOptions
  );
}

/**
 * Verifies a 2FA pre-authentication token
 */
export function verify2FAPreAuthToken(token: string): TwoFactorPreAuthPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'AutoAudit-Auth-Engine',
      audience: 'autoaudit-2fa-preauth'
    }) as TwoFactorPreAuthPayload;

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Hashes a password using bcrypt with 12 salt rounds
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compares a plain password against a bcrypt hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}
