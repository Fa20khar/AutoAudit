import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, AdminJwtPayload, comparePassword, hashPassword } from '../utils/jwt';
import { AdminUserModel } from '../mongodb/models/AdminUser';
import { isMongoConnected } from '../mongodb/connection';

// Extend Express Request interface type with authenticated adminUser
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminJwtPayload;
}

// In-memory brute-force rate limiter for admin authentication attempts
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

// Periodic cleanup of expired rate limit entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of loginRateLimitMap.entries()) {
      if (entry.lockUntil && entry.lockUntil <= now) {
        loginRateLimitMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000).unref();
}

export interface InMemoryAdmin {
  email: string;
  passwordHash: string;
  name: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
}

// In-memory root user fallback ONLY if explicitly configured via environment variables
let inMemoryRootUser: InMemoryAdmin | null = null;

export function setInMemoryRootUser(user: InMemoryAdmin): void {
  inMemoryRootUser = user;
}

export function getInMemoryRootUser(): InMemoryAdmin | null {
  return inMemoryRootUser;
}

export function updateInMemoryRoot2FA(enabled: boolean, secret: string, backupCodes: string[] = []): void {
  if (inMemoryRootUser) {
    inMemoryRootUser.twoFactorEnabled = enabled;
    inMemoryRootUser.twoFactorSecret = secret;
    inMemoryRootUser.backupCodes = backupCodes;
  }
}

export function clearInMemoryRootUser(): void {
  inMemoryRootUser = null;
}

/**
 * Checks whether any administrator account has been provisioned
 */
export async function isAnyAdminConfigured(): Promise<boolean> {
  try {
    if (isMongoConnected()) {
      const count = await AdminUserModel.countDocuments({ isActive: true });
      if (count > 0) return true;
    }
  } catch (err: any) {
    console.warn('[Admin Check] MongoDB query warning:', err?.message);
  }

  return inMemoryRootUser !== null;
}

/**
 * Checks and optionally seeds the initial root administrator account on startup
 * only if ADMIN_INITIAL_PASSWORD or ADMIN_PASSWORD is provided via secure environment variables.
 * NO hardcoded passwords exist in the codebase.
 */
export async function ensureDefaultAdminAccount(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@autoaudit.com').toLowerCase().trim();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!initialPassword || initialPassword.trim().length === 0) {
    console.log('[Auth Subsystem] No initial admin password configured in environment. Admin accounts must be created via one-time setup.');
    return;
  }

  try {
    if (isMongoConnected()) {
      const existingAdmin = await AdminUserModel.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const passwordHash = await hashPassword(initialPassword.trim());
        await AdminUserModel.create({
          email: adminEmail,
          passwordHash,
          name: 'AutoAudit Root Administrator',
          role: 'superadmin',
          isActive: true,
          loginAttempts: 0
        });
        console.log(`[Auth Provisioning] Initialized root administrator (${adminEmail}) in MongoDB Atlas with bcrypt protection.`);
      }
    } else {
      // Store hashed credential in memory for offline / local-test fallback
      const passwordHash = await hashPassword(initialPassword.trim());
      inMemoryRootUser = {
        email: adminEmail,
        passwordHash,
        name: 'AutoAudit Administrator'
      };
    }
  } catch (err: any) {
    console.warn('[Auth Provisioning] Could not seed admin user in MongoDB:', err?.message || err);
  }
}

export interface AuthenticatedAdminInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

/**
 * Authenticates admin credentials using bcrypt against MongoDB Atlas
 */
export async function authenticateAdmin(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: AuthenticatedAdminInfo }> {
  if (!email || !password) {
    return { success: false };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Primary check: Query active administrator from MongoDB Atlas
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
              role: user.role || 'staff_admin',
              twoFactorEnabled: Boolean(user.twoFactorEnabled && user.twoFactorSecret),
              twoFactorSecret: user.twoFactorSecret
            }
          };
        }
      }
    } catch (err: any) {
      console.warn('[Auth Error] Error querying AdminUserModel:', err?.message);
    }
  }

  // 2. Secondary check: Compare against inMemoryRootUser if MongoDB was offline and env password was set
  if (inMemoryRootUser && normalizedEmail === inMemoryRootUser.email) {
    const isMatch = await comparePassword(password, inMemoryRootUser.passwordHash);
    if (isMatch) {
      return {
        success: true,
        user: {
          id: 'admin_sys_root',
          email: inMemoryRootUser.email,
          name: inMemoryRootUser.name,
          role: 'superadmin',
          twoFactorEnabled: Boolean(inMemoryRootUser.twoFactorEnabled && inMemoryRootUser.twoFactorSecret),
          twoFactorSecret: inMemoryRootUser.twoFactorSecret
        }
      };
    }
  }

  return { success: false };
}

/**
 * Express middleware to enforce valid JWT authentication on administrative routes.
 * Blocks any request that does not provide a cryptographically verified JWT.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
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

  // Strictly enforce server-side administrator role verification
  const ALLOWED_ADMIN_ROLES = ['superadmin', 'staff_admin', 'fulfillment_specialist'];
  if (!decoded.role || !ALLOWED_ADMIN_ROLES.includes(decoded.role)) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ROLE',
      error: 'Forbidden: Insufficient administrative privileges.'
    });
    return;
  }

  // Attach decoded token payload to request for downstream handlers
  (req as AuthenticatedRequest).adminUser = decoded;
  (req as any).user = decoded;

  next();
}

/**
 * Middleware to restrict action exclusively to superadmin accounts
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAdminAuth(req, res, () => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.adminUser?.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        error: 'Forbidden: This action requires superadmin administrative privileges.'
      });
      return;
    }
    next();
  });
}
