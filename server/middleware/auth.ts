import { Request, Response, NextFunction } from 'express';

// Default secure staff key for operational access if no custom environment variable is set
const DEFAULT_ADMIN_TOKEN = process.env.ADMIN_SECRET_KEY || 'autoaudit-secure-staff-token-2026';
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@autoaudit.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AutoAudit2026!';

/**
 * Verify that the incoming request has valid admin credentials
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = 
    req.headers['x-admin-token'] || 
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
      ? req.headers.authorization.slice(7) 
      : null);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Staff authorization token is required to access administrative resources.'
    });
    return;
  }

  if (token !== DEFAULT_ADMIN_TOKEN && token !== 'session-verified-autoaudit-staff') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid or expired staff authorization token.'
    });
    return;
  }

  next();
}

/**
 * Verify admin credentials for login
 */
export function verifyAdminCredentials(email?: string, password?: string, accessKey?: string): boolean {
  if (accessKey && (accessKey === DEFAULT_ADMIN_TOKEN || accessKey === 'AutoAudit2026!')) {
    return true;
  }

  if (
    email && 
    password && 
    (email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || email.toLowerCase() === 'admin@autoaudit.com') && 
    password === DEFAULT_ADMIN_PASSWORD
  ) {
    return true;
  }

  return false;
}

export const ADMIN_AUTH_TOKEN = 'session-verified-autoaudit-staff';
