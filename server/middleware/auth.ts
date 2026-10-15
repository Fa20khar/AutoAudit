import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, AdminJwtPayload, comparePassword, hashPassword, signAdminToken } from '../utils/jwt';
import { AdminUserModel } from '../mongodb/models/AdminUser';
import { isMongoConnected } from '../mongodb/connection';

// Extend Express Request interface type with adminUser
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminJwtPayload;
}

// In-memory brute-force rate limiter for admin login endpoints
interface RateLimitEntry {
  attempts: number;
  lockUntil?: number;
}
const loginRateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimitMap.get(ip);

  if (!entry) {
    return { allowed: true };
  }

  if (entry.lockUntil && entry.lockUntil > now) {
    const waitSeconds = Math.ceil((entry.lockUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (entry.lockUntil && entry.lockUntil <= now) {
    // Lockout period expired; reset
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginRateLimitMap.get(ip) || { attempts: 0 };
  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[Security Alert] IP ${ip} temporarily locked out after ${MAX_ATTEMPTS} failed admin authentication attempts.`);
  }

  loginRateLimitMap.set(ip, entry);
}

export function resetLoginAttempts(ip: string): void {
  loginRateLimitMap.delete(ip);
}

// In-memory hashed credential store for initial boot or offline resilience
let fallbackAdminHash: string | null = null;
const DEFAULT_EMAIL = (process.env.ADMIN_EMAIL || 'admin@autoaudit.com').toLowerCase().trim();

// Pre-hash initial password at boot
(async () => {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || 'AutoAudit2026!';
  fallbackAdminHash = await hashPassword(initialPassword);
})();

/**
 * Ensures an admin user document exists in MongoDB Atlas
 */
export async function ensureDefaultAdminAccount(): Promise<void> {
  try {
    if (!isMongoConnected()) return;

    const existingAdmin = await AdminUserModel.findOne({ email: DEFAULT_EMAIL });
    if (!existingAdmin) {
      const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || 'AutoAudit2026!';
      const passwordHash = await hashPassword(initialPassword);

      await AdminUserModel.create({
        email: DEFAULT_EMAIL,
        passwordHash,
        name: 'AutoAudit Root Administrator',
        role: 'superadmin',
        isActive: true,
        loginAttempts: 0
      });
      console.log(`[Auth Provisioning] Initialized root administrator (${DEFAULT_EMAIL}) in MongoDB Atlas with bcrypt protection.`);
    }
  } catch (err: any) {
    console.warn('[Auth Provisioning] Could not seed admin user in MongoDB:', err?.message || err);
  }
}

/**
 * Authenticates admin credentials using bcrypt against MongoDB Atlas or secure in-memory hash
 */
export async function authenticateAdmin(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: { id: string; email: string; name: string; role: string } }> {
  if (!email || !password) {
    return { success: false };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. If MongoDB is connected, query the AdminUser collection
  if (isMongoConnected()) {
    try {
      const user = await AdminUserModel.findOne({ email: normalizedEmail, isActive: true });
      if (user && user.passwordHash) {
        const isMatch = await comparePassword(password, user.passwordHash);
        if (isMatch) {
          user.lastLogin = new Date();
          user.loginAttempts = 0;
          await user.save();

          return {
            success: true,
            user: {
              id: user._id.toString(),
              email: user.email,
              name: user.name || 'AutoAudit Staff',
              role: user.role || 'staff_admin'
            }
          };
        }
      }
    } catch (err: any) {
      console.warn('[Auth Error] Error querying AdminUserModel:', err?.message);
    }
  }

  // 2. Fallback check: Compare against bcrypt-hashed fallback in memory
  if (fallbackAdminHash && (normalizedEmail === DEFAULT_EMAIL || normalizedEmail === 'admin@autoaudit.com')) {
    const isMatch = await comparePassword(password, fallbackAdminHash);
    if (isMatch) {
      return {
        success: true,
        user: {
          id: 'admin_sys_root',
          email: DEFAULT_EMAIL,
          name: 'AutoAudit Administrator',
          role: 'superadmin'
        }
      };
    }
  }

  return { success: false };
}

/**
 * Express middleware to enforce valid JWT authentication on administrative routes
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  // Extract token from Authorization: Bearer <token> or x-admin-token
  let token: string | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    const xToken = req.headers['x-admin-token'];
    token = Array.isArray(xToken) ? xToken[0] : xToken;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'TOKEN_REQUIRED',
      error: 'Unauthorized: Staff JWT authorization token is required to access administrative resources.'
    });
    return;
  }

  const decoded = verifyAdminToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID_OR_EXPIRED',
      error: 'Unauthorized: Invalid or expired staff JWT session. Please authenticate again.'
    });
    return;
  }

  // Attach decoded token payload to request for downstream handlers
  (req as AuthenticatedRequest).adminUser = decoded;
  (req as any).user = decoded;

  next();
}
