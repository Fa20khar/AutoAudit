import { Router, Response } from 'express';
import { requireAdminAuth, AuthenticatedRequest } from '../middleware/auth';
import { adminMongodbRouter } from './adminMongodb';
import { statsRouter } from './stats';
import { ordersRouter } from './orders';
import { emailsRouter } from './emails';
import { intakeRouter } from './intake';
import { analyticsRouter } from './analytics';
import { couponsRouter } from './coupons';
import { servicesRouter } from './services';
import { AdminUserModel } from '../mongodb/models/AdminUser';
import { hashPassword } from '../utils/jwt';
import { isMongoConnected } from '../mongodb/connection';
import { adminSecurityRouter } from './security';

export const adminRouter = Router();

// ==============================================================================
// 1. Mandatory JWT Authentication Middleware
// EVERY route mounted on /api/admin is strictly protected and requires a valid JWT
// ==============================================================================
adminRouter.use(requireAdminAuth);

// ==============================================================================
// 2. Core Administrative Identity & Health Endpoints
// ==============================================================================

/**
 * GET /api/admin/me
 * Returns decoded JWT staff profile and operational privileges
 */
adminRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.adminUser,
    role: req.adminUser?.role || 'staff_admin',
    authenticatedAt: new Date().toISOString()
  });
});

/**
 * GET /api/admin/verify
 * Validates active staff session token
 */
adminRouter.get('/verify', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    authenticated: true,
    user: req.adminUser
  });
});

/**
 * GET /api/admin/users
 * Lists administrative staff users (superadmin restricted or staff visibility)
 */
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (isMongoConnected()) {
      const users = await AdminUserModel.find({}, '-passwordHash').sort({ createdAt: -1 });
      res.json({
        success: true,
        data: users
      });
      return;
    }

    // Offline / fallback staff list
    res.json({
      success: true,
      data: [
        {
          id: 'admin_sys_root',
          email: req.adminUser?.email || 'admin@autoaudit.com',
          name: req.adminUser?.name || 'AutoAudit Administrator',
          role: req.adminUser?.role || 'superadmin',
          isActive: true
        }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Could not list admin users.' });
  }
});

/**
 * POST /api/admin/users
 * Provisions a new administrative user with bcrypt-hashed password (superadmin role required)
 */
adminRouter.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  if (req.adminUser?.role !== 'superadmin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Only superadmin accounts can provision new administrator accounts.'
    });
    return;
  }

  const { email, password, name, role = 'staff_admin' } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    return;
  }

  try {
    if (!isMongoConnected()) {
      res.status(503).json({ success: false, error: 'Database must be connected to persist new admin users.' });
      return;
    }

    const existing = await AdminUserModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, error: 'An administrator with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser = await AdminUserModel.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || 'Staff Administrator',
      role: ['superadmin', 'staff_admin', 'fulfillment_specialist'].includes(role) ? role : 'staff_admin',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'New administrator user created successfully.',
      data: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error provisioning admin user.' });
  }
});

// ==============================================================================
// 3. Mount Administrative Domain Sub-Routers
// All of these inherit the top-level requireAdminAuth JWT middleware
// ==============================================================================
adminRouter.use('/mongodb', adminMongodbRouter);
adminRouter.use('/stats', statsRouter);
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/emails', emailsRouter);
adminRouter.use('/intake', intakeRouter);
adminRouter.use('/analytics', analyticsRouter);
adminRouter.use('/coupons', couponsRouter);
adminRouter.use('/services', servicesRouter);
adminRouter.use('/security', adminSecurityRouter);
