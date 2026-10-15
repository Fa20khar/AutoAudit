import { Router, Request, Response } from 'express';
import {
  authenticateAdmin,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  AuthenticatedRequest
} from '../middleware/auth';
import { signAdminToken, verifyAdminToken } from '../utils/jwt';

export const authRouter = Router();

/**
 * POST /api/auth/admin-login
 * Authenticates staff credentials, verifies bcrypt hash, and generates a signed JWT
 */
authRouter.post('/admin-login', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';

  // Check rate limit (max 5 failed attempts per 15 minutes)
  const rateLimitCheck = checkLoginRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      error: `Too many failed login attempts from this address. Access temporarily locked for ${rateLimitCheck.waitSeconds}s.`
    });
    return;
  }

  const { email, password, accessKey } = req.body;
  const targetPassword = password || accessKey;

  if (!email || !targetPassword) {
    recordFailedLoginAttempt(clientIp);
    res.status(400).json({
      success: false,
      code: 'MISSING_CREDENTIALS',
      error: 'Both staff email address and password/access passphrase are required.'
    });
    return;
  }

  const authResult = await authenticateAdmin(email, targetPassword);

  if (!authResult.success || !authResult.user) {
    recordFailedLoginAttempt(clientIp);
    res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      error: 'Invalid administrative credentials. Access restricted to authorized AutoAudit staff.'
    });
    return;
  }

  // Clear failed attempts upon successful login
  resetLoginAttempts(clientIp);

  // Generate cryptographic JWT token with 8-hour lifetime
  const token = signAdminToken({
    id: authResult.user.id,
    email: authResult.user.email,
    name: authResult.user.name,
    role: authResult.user.role
  }, '8h');

  res.json({
    success: true,
    message: 'Staff authentication successful. Administrative JWT session created.',
    token,
    tokenType: 'Bearer',
    expiresIn: '8h',
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      role: authResult.user.role,
      loginTime: new Date().toISOString()
    }
  });
});

/**
 * GET /api/auth/verify
 * Validates the caller's JWT token
 */
authRouter.get('/verify', (req: Request, res: Response) => {
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
      authenticated: false,
      code: 'TOKEN_REQUIRED',
      error: 'No authorization token supplied.'
    });
    return;
  }

  const decoded = verifyAdminToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      authenticated: false,
      code: 'TOKEN_INVALID',
      error: 'Invalid or expired staff session token.'
    });
    return;
  }

  res.json({
    success: true,
    authenticated: true,
    user: {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : undefined
    }
  });
});

/**
 * POST /api/auth/refresh
 * Refreshes an active or recently valid JWT token
 */
authRouter.post('/refresh', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const current = req.adminUser;
  if (!current) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const newToken = signAdminToken({
    id: current.sub,
    email: current.email,
    name: current.name,
    role: current.role
  }, '8h');

  res.json({
    success: true,
    message: 'Staff session renewed.',
    token: newToken,
    tokenType: 'Bearer',
    expiresIn: '8h'
  });
});

/**
 * GET /api/auth/me
 * Retrieves current admin profile from verified JWT
 */
authRouter.get('/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.adminUser
  });
});

/**
 * POST /api/auth/admin-logout
 */
authRouter.post('/admin-logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Staff administrator logged out successfully.'
  });
});
