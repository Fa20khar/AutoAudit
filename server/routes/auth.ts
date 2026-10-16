import { Router, Request, Response } from 'express';
import {
  authenticateAdmin,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  isAnyAdminConfigured,
  setInMemoryRootUser,
  getInMemoryRootUser,
  updateInMemoryRoot2FA,
  AuthenticatedRequest
} from '../middleware/auth';
import {
  signAdminToken,
  verifyAdminToken,
  hashPassword,
  timingSafeEqualString,
  sign2FAPreAuthToken,
  verify2FAPreAuthToken
} from '../utils/jwt';
import {
  generateTotpSecret,
  generateOtpAuthUrl,
  verifyTotp,
  generateBackupCodes
} from '../utils/totp';
import { AdminUserModel } from '../mongodb/models/AdminUser';
import { isMongoConnected } from '../mongodb/connection';

export const authRouter = Router();

/**
 * GET /api/auth/setup-status
 * Informs the frontend whether an initial administrator account has been provisioned
 */
authRouter.get('/setup-status', async (_req: Request, res: Response) => {
  const adminExists = await isAnyAdminConfigured();
  const setupSecretConfigured = Boolean(
    process.env.ADMIN_SETUP_SECRET && process.env.ADMIN_SETUP_SECRET.trim().length >= 16
  );

  res.json({
    success: true,
    isSetupComplete: adminExists,
    canSetup: !adminExists && setupSecretConfigured
  });
});

/**
 * POST /api/auth/setup-admin
 * Secure, one-time administrator provisioning endpoint.
 * Requires the ADMIN_SETUP_SECRET set in the server environment variables.
 * Permanently locks once the first administrator account is created.
 */
authRouter.post('/setup-admin', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';
  const configuredSetupSecret = process.env.ADMIN_SETUP_SECRET;

  if (!configuredSetupSecret || configuredSetupSecret.trim().length < 16) {
    res.status(403).json({
      success: false,
      code: 'SETUP_DISABLED',
      error: 'One-time admin setup is disabled on this server because ADMIN_SETUP_SECRET is not configured in backend environment variables.'
    });
    return;
  }

  // Check if an admin account already exists
  const alreadyConfigured = await isAnyAdminConfigured();
  if (alreadyConfigured) {
    res.status(403).json({
      success: false,
      code: 'SETUP_ALREADY_COMPLETED',
      error: 'Initial administrator setup has already been completed. This endpoint is permanently disabled.'
    });
    return;
  }

  const providedSecret = req.headers['x-admin-setup-secret'] || req.body?.setupSecret;
  if (!providedSecret || typeof providedSecret !== 'string') {
    res.status(401).json({
      success: false,
      code: 'SETUP_SECRET_REQUIRED',
      error: 'ADMIN_SETUP_SECRET must be supplied via x-admin-setup-secret header or setupSecret field.'
    });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const isMatch = timingSafeEqualString(providedSecret.trim(), configuredSetupSecret.trim());
  if (!isMatch) {
    recordFailedLoginAttempt(clientIp);
    res.status(401).json({
      success: false,
      code: 'INVALID_SETUP_SECRET',
      error: 'Invalid setup secret. Unauthorized administrative provisioning attempt.'
    });
    return;
  }

  const { email, password, name } = req.body || {};
  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Administrator email and password are required.'
    });
    return;
  }

  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long.'
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);

  try {
    if (isMongoConnected()) {
      await AdminUserModel.create({
        email: normalizedEmail,
        passwordHash,
        name: name || 'Root Administrator',
        role: 'superadmin',
        isActive: true,
        loginAttempts: 0
      });
    } else {
      setInMemoryRootUser({
        email: normalizedEmail,
        passwordHash,
        name: name || 'Root Administrator'
      });
    }

    console.log(`[Security Alert] Initial root administrator account (${normalizedEmail}) provisioned successfully via setup endpoint.`);

    res.status(201).json({
      success: true,
      message: 'Root administrator account initialized successfully. Setup endpoint is now permanently locked.'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to initialize administrator account.'
    });
  }
});

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

  const { email, password, accessKey } = req.body || {};
  const targetPassword = password || accessKey;

  if (!email || !targetPassword) {
    recordFailedLoginAttempt(clientIp);
    res.status(400).json({
      success: false,
      code: 'MISSING_CREDENTIALS',
      error: 'Both staff email address and password are required.'
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

  // Clear rate-limit attempts on successful password check
  resetLoginAttempts(clientIp);

  // If user already has 2FA enabled, challenge for 6-digit TOTP code
  if (authResult.user.twoFactorEnabled && authResult.user.twoFactorSecret) {
    const preAuthToken = sign2FAPreAuthToken(
      {
        sub: authResult.user.id,
        email: authResult.user.email,
        purpose: '2fa_login'
      },
      '10m'
    );

    res.json({
      success: true,
      requires2FA: true,
      setup2FARequired: false,
      preAuthToken,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name
      },
      message: 'Password accepted. Two-factor authenticator code required.'
    });
    return;
  }

  // If user does not have 2FA enabled, enforce immediate authenticator QR linking
  const newSecret = generateTotpSecret(20);
  const otpauthUrl = generateOtpAuthUrl({
    secret: newSecret,
    email: authResult.user.email,
    issuer: 'AutoAudit'
  });
  const backupCodes = generateBackupCodes(8);

  // Store pending secret
  try {
    if (isMongoConnected()) {
      await AdminUserModel.findByIdAndUpdate(authResult.user.id, {
        twoFactorPendingSecret: newSecret,
        backupCodes
      });
    } else {
      updateInMemoryRoot2FA(false, newSecret, backupCodes);
    }
  } catch (err: any) {
    console.warn('[2FA Setup] Error storing pending secret:', err?.message);
  }

  const preAuthToken = sign2FAPreAuthToken(
    {
      sub: authResult.user.id,
      email: authResult.user.email,
      purpose: '2fa_setup',
      pendingSecret: newSecret
    },
    '15m'
  );

  res.json({
    success: true,
    requires2FA: true,
    setup2FARequired: true,
    preAuthToken,
    secret: newSecret,
    otpauthUrl,
    backupCodes,
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name
    },
    message: 'Initial two-factor setup required. Scan the QR code to link your authenticator app.'
  });
});

/**
 * POST /api/auth/2fa/verify-setup
 * Confirms the first 6-digit code after scanning the QR code, activates 2FA, and issues JWT
 */
authRouter.post('/2fa/verify-setup', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';
  const { preAuthToken, code } = req.body || {};

  if (!preAuthToken || !code) {
    res.status(400).json({
      success: false,
      code: 'MISSING_DATA',
      error: 'Both pre-authentication token and 6-digit TOTP code are required.'
    });
    return;
  }

  const decoded = verify2FAPreAuthToken(preAuthToken);
  if (!decoded || decoded.purpose !== '2fa_setup' || !decoded.pendingSecret) {
    res.status(401).json({
      success: false,
      code: 'INVALID_PREAUTH_TOKEN',
      error: 'Pre-authentication session expired or invalid. Please sign in with your password again.'
    });
    return;
  }

  // Verify the 6-digit code against the pending secret
  const isValid = verifyTotp(String(code), decoded.pendingSecret, { window: 1 });
  if (!isValid) {
    recordFailedLoginAttempt(clientIp);
    res.status(400).json({
      success: false,
      code: 'INVALID_2FA_CODE',
      error: 'Invalid 6-digit authenticator code. Make sure your device clock is synchronized and try again.'
    });
    return;
  }

  resetLoginAttempts(clientIp);

  // Persist 2FA activation
  let adminRole = 'staff_admin';
  let adminName = 'AutoAudit Administrator';

  try {
    if (isMongoConnected()) {
      const user = await AdminUserModel.findById(decoded.sub);
      if (user) {
        user.twoFactorEnabled = true;
        user.twoFactorSecret = decoded.pendingSecret;
        user.twoFactorPendingSecret = undefined;
        await user.save();
        adminRole = user.role || 'staff_admin';
        adminName = user.name || 'AutoAudit Staff';
      }
    } else {
      updateInMemoryRoot2FA(true, decoded.pendingSecret);
      const root = getInMemoryRootUser();
      if (root) {
        adminRole = 'superadmin';
        adminName = root.name;
      }
    }
  } catch (err: any) {
    console.error('[2FA Activation Error]:', err);
  }

  // Issue full administrative JWT token
  const token = signAdminToken(
    {
      id: decoded.sub,
      email: decoded.email,
      name: adminName,
      role: adminRole
    },
    '8h'
  );

  console.log(`[Security Alert] 2FA successfully configured and verified for administrator ${decoded.email}.`);

  res.json({
    success: true,
    message: 'Authenticator successfully linked! Two-factor protection is now active.',
    token,
    tokenType: 'Bearer',
    expiresIn: '8h',
    user: {
      id: decoded.sub,
      email: decoded.email,
      name: adminName,
      role: adminRole,
      twoFactorEnabled: true,
      loginTime: new Date().toISOString()
    }
  });
});

/**
 * POST /api/auth/2fa/verify-login
 * Validates the 6-digit TOTP code during standard login and issues the administrative JWT
 */
authRouter.post('/2fa/verify-login', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';

  // Check rate limiting
  const rateLimitCheck = checkLoginRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      error: `Too many failed verification attempts. Access temporarily locked for ${rateLimitCheck.waitSeconds}s.`
    });
    return;
  }

  const { preAuthToken, code } = req.body || {};
  if (!preAuthToken || !code) {
    res.status(400).json({
      success: false,
      code: 'MISSING_DATA',
      error: 'Both pre-authentication token and 6-digit code are required.'
    });
    return;
  }

  const decoded = verify2FAPreAuthToken(preAuthToken);
  if (!decoded || decoded.purpose !== '2fa_login') {
    res.status(401).json({
      success: false,
      code: 'INVALID_PREAUTH_TOKEN',
      error: 'Pre-authentication session expired or invalid. Please sign in with your password again.'
    });
    return;
  }

  // Retrieve administrator user
  let userSecret: string | undefined;
  let backupCodes: string[] = [];
  let adminRole = 'staff_admin';
  let adminName = 'AutoAudit Staff';
  let mongoUser: any = null;

  if (isMongoConnected()) {
    try {
      mongoUser = await AdminUserModel.findById(decoded.sub);
      if (mongoUser) {
        userSecret = mongoUser.twoFactorSecret;
        backupCodes = mongoUser.backupCodes || [];
        adminRole = mongoUser.role || 'staff_admin';
        adminName = mongoUser.name || 'AutoAudit Staff';
      }
    } catch (err: any) {
      console.warn('[2FA Verify] Database query warning:', err?.message);
    }
  } else {
    const root = getInMemoryRootUser();
    if (root && root.email === decoded.email) {
      userSecret = root.twoFactorSecret;
      backupCodes = root.backupCodes || [];
      adminRole = 'superadmin';
      adminName = root.name;
    }
  }

  if (!userSecret) {
    res.status(400).json({
      success: false,
      code: '2FA_NOT_CONFIGURED',
      error: 'Two-factor authentication is not configured for this account.'
    });
    return;
  }

  const cleanCode = String(code).trim().toUpperCase();

  // 1. Check if input matches an emergency backup code
  let isBackupMatch = false;
  if (backupCodes.includes(cleanCode)) {
    isBackupMatch = true;
    // Consume backup code
    if (mongoUser) {
      mongoUser.backupCodes = backupCodes.filter((c: string) => c !== cleanCode);
      await mongoUser.save().catch(() => {});
    }
  }

  // 2. Check 6-digit TOTP algorithm
  const isTotpValid = isBackupMatch || verifyTotp(cleanCode, userSecret, { window: 1 });

  if (!isTotpValid) {
    recordFailedLoginAttempt(clientIp);
    res.status(401).json({
      success: false,
      code: 'INVALID_2FA_CODE',
      error: 'Invalid 6-digit authenticator code. Please check your authenticator app and try again.'
    });
    return;
  }

  // Reset failed attempts on success
  resetLoginAttempts(clientIp);

  // Issue full administrative JWT token
  const token = signAdminToken(
    {
      id: decoded.sub,
      email: decoded.email,
      name: adminName,
      role: adminRole
    },
    '8h'
  );

  res.json({
    success: true,
    message: isBackupMatch
      ? 'Authentication successful via emergency backup code.'
      : 'Two-factor verification successful.',
    token,
    tokenType: 'Bearer',
    expiresIn: '8h',
    user: {
      id: decoded.sub,
      email: decoded.email,
      name: adminName,
      role: adminRole,
      twoFactorEnabled: true,
      loginTime: new Date().toISOString()
    }
  });
});

/**
 * POST /api/auth/2fa/reset-request
 * Allows an authenticated administrator to request a new QR code to re-link their authenticator
 */
authRouter.post('/2fa/reset-request', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.adminUser;
  if (!admin) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const newSecret = generateTotpSecret(20);
  const otpauthUrl = generateOtpAuthUrl({
    secret: newSecret,
    email: admin.email,
    issuer: 'AutoAudit'
  });
  const backupCodes = generateBackupCodes(8);

  const preAuthToken = sign2FAPreAuthToken(
    {
      sub: admin.sub,
      email: admin.email,
      purpose: '2fa_setup',
      pendingSecret: newSecret
    },
    '15m'
  );

  res.json({
    success: true,
    preAuthToken,
    secret: newSecret,
    otpauthUrl,
    backupCodes,
    message: 'Scan the new QR code in your authenticator app and enter the 6-digit code to confirm re-linking.'
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
    token: newToken,
    expiresIn: '8h'
  });
});
