import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { requireAdminAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyAdminToken } from '../utils/jwt';
import { Order, AuditLog } from '../../src/types';
import { triggerAutomatedEmailSequence, sendMockEmail } from '../services/smtp';
import { handleNewOrderCreation, processOrderReport } from '../services/mockReportGenerator';

export const ordersRouter = Router();

// Helper to sanitize text input against script tags / XSS
function sanitizeText(str: any): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

// Standard email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Standard 17-char VIN validation regex (excluding I, O, Q)
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

// GET /api/orders/db-status (check database health and active engine)
ordersRouter.get('/db-status', async (_req: Request, res: Response) => {
  const status = await db.getDatabaseStatus();
  res.json({
    success: true,
    database: status,
    instructions: {
      primary: 'MongoDB Atlas',
      isMongoConfigured: status.isMongoConfigured,
      isMongoConnected: status.isMongoConnected,
      mongoHelp: !status.isMongoConfigured
        ? 'Configure MONGODB_URI=mongodb+srv://<user>:<password>@<host>/autoaudit_db in your environment variables to enable MongoDB Atlas persistence.'
        : !status.isMongoConnected
        ? 'MongoDB Atlas is configured but connection is not ready. Verify network access allows IP 0.0.0.0/0 in MongoDB Atlas.'
        : 'MongoDB Atlas is actively connected and serving requests.',
      fallbackDatabase: status.fallbackDatabase
    }
  });
});

// GET /api/orders (admin & customer lookup)
// If email query is provided: customer self-service lookup for their own orders
// If no email query: require staff authorization
ordersRouter.get('/', async (req: Request, res: Response) => {
  const { email, status, search } = req.query;

  // Protect all-order retrieval with admin authentication
  if (!email) {
    return requireAdminAuth(req, res, async () => {
      const orders = await db.getOrdersAsync({
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined
      });

      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    });
  }

  // Customer self-service: strictly scoped to matching email
  const cleanEmail = String(email).trim().toLowerCase();
  const customerOrders = await db.getOrdersAsync({
    email: cleanEmail,
    search: typeof search === 'string' ? search : undefined
  });

  // Strip internal notes and sensitive audit information for customer lookup
  const sanitizedOrders = customerOrders.map(order => {
    const { internalNotes, ...safeOrder } = order as any;
    return safeOrder;
  });

  res.json({
    success: true,
    count: sanitizedOrders.length,
    data: sanitizedOrders
  });
});

// GET /api/orders/:id
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await db.getOrderByIdAsync(id);

  if (!order) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  // Check if caller is authenticated staff
  let isStaff = false;
  const authHeader = req.headers.authorization;
  const xToken = req.headers['x-admin-token'];
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : Array.isArray(xToken) ? xToken[0] : xToken;

  if (rawToken && verifyAdminToken(rawToken)) {
    isStaff = true;
  }

  // If customer is looking up order, strip internal staff notes and internal audit logs
  let sanitizedOrder = order;
  if (!isStaff) {
    const { internalNotes, ...safeOrder } = order as any;
    sanitizedOrder = safeOrder;
  }

  res.json({
    success: true,
    data: sanitizedOrder
  });
});

// POST /api/orders
ordersRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body;

  // Validation
  if (!body.serviceId) {
    res.status(400).json({ success: false, error: 'Service ID is required.' });
    return;
  }
  if (!body.customer?.email || !body.customer?.fullName) {
    res.status(400).json({ success: false, error: 'Customer name and email are required.' });
    return;
  }

  const cleanEmail = sanitizeText(body.customer.email).toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    res.status(422).json({ success: false, error: 'Please enter a valid email address (e.g. name@example.com).' });
    return;
  }

  const cleanName = sanitizeText(body.customer.fullName);
  if (cleanName.length < 2) {
    res.status(422).json({ success: false, error: 'Customer name must be at least 2 characters.' });
    return;
  }

  if (!body.vehicle?.vinOrReg) {
    res.status(400).json({ success: false, error: 'Vehicle VIN or Registration Plate is required.' });
    return;
  }

  const cleanVin = sanitizeText(body.vehicle.vinOrReg).toUpperCase();
  if (body.vehicle.isVin !== false && cleanVin.length === 17) {
    if (!VIN_REGEX.test(cleanVin)) {
      res.status(422).json({
        success: false,
        error: 'Invalid VIN: Characters I, O, and Q are disallowed by international standards.'
      });
      return;
    }
  }

  // Calculate Subtotal & Verify Promo Code
  const service = await db.getServiceByIdAsync(body.serviceId);
  const subtotal = service ? service.price : (Number(body.subtotal) || 28.99);

  let discountAmount = 0;
  let couponCode = body.couponCode ? sanitizeText(body.couponCode).toUpperCase() : null;

  if (couponCode) {
    const couponValidation = db.validateCoupon(couponCode);
    if (couponValidation.valid && couponValidation.coupon) {
      if (couponValidation.coupon.discountPercent) {
        discountAmount = parseFloat(((subtotal * couponValidation.coupon.discountPercent) / 100).toFixed(2));
      } else if (couponValidation.coupon.discountFixed) {
        discountAmount = Math.min(couponValidation.coupon.discountFixed, subtotal);
      }
      db.incrementCouponUsage(couponCode);
    } else {
      couponCode = null;
    }
  }

  const total = parseFloat(Math.max(0, subtotal - discountAmount).toFixed(2));
  const newOrderNum = `AA-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();

  const auditLogs: AuditLog[] = [
    {
      id: `log-${Date.now()}-1`,
      timestamp: now,
      actor: 'Customer (Checkout)',
      action: 'Order Placed',
      details: couponCode ? `Coupon ${couponCode} applied (-$${discountAmount}).` : 'Standard checkout.'
    },
    {
      id: `log-${Date.now()}-2`,
      timestamp: now,
      actor: 'Payment Gateway',
      action: 'Payment Captured',
      details: `$${total} processed via ${body.payment?.method || 'Credit Card'}.`
    }
  ];

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: newOrderNum,
    serviceId: body.serviceId,
    serviceName: service ? service.name : (body.serviceName || 'Vehicle History Report'),
    status: 'Paid / New',
    subtotal,
    discountAmount,
    total,
    couponCode: couponCode || undefined,
    customer: {
      fullName: cleanName,
      email: cleanEmail,
      phone: body.customer.phone ? sanitizeText(body.customer.phone) : '',
      smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true
    },
    smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true,
    vehicle: {
      vinOrReg: cleanVin,
      isVin: body.vehicle.isVin !== false,
      make: body.vehicle.make ? sanitizeText(body.vehicle.make) : 'Verified',
      model: body.vehicle.model ? sanitizeText(body.vehicle.model) : 'Series',
      year: Number(body.vehicle.year) || new Date().getFullYear(),
      mileage: body.vehicle.mileage ? sanitizeText(body.vehicle.mileage) : 'Pending audit',
      countryOrState: body.vehicle.countryOrState ? sanitizeText(body.vehicle.countryOrState) : 'US',
      customerNotes: body.vehicle.customerNotes ? sanitizeText(body.vehicle.customerNotes) : ''
    },
    payment: {
      status: 'Paid',
      gatewayRef: `ch_${Math.random().toString(36).substring(2, 15)}`,
      paidAt: now,
      method: body.payment?.method || 'Visa ending in 4242'
    },
    internalNotes: 'Order received. Automated NMVTIS and title check initialized.',
    createdAt: now,
    updatedAt: now,
    auditLogs
  };

  // Explicit write completion guarantee before returning HTTP 201 response
  await db.createOrderAsync(newOrder);

  // Trigger Mock Report Generator Service (triggers when order is Paid)
  handleNewOrderCreation(newOrder);

  // Trigger automated mock SMTP email sequence (Confirmation -> In-Progress -> Ready)
  triggerAutomatedEmailSequence(newOrder, {
    stageDelaySeconds: { stage2: 4, stage3: 8 },
    autoAdvanceOrderStatus: true
  }).catch(err => {
    console.error('[SMTP] Error starting automated email sequence:', err);
  });

  const { internalNotes, ...safeNewOrder } = newOrder as any;

  res.status(201).json({
    success: true,
    message: 'Order created successfully. Processing has begun.',
    data: safeNewOrder
  });
});

// PATCH /api/orders/:id/payment (strictly requires administrator authorization)
ordersRouter.patch('/:id/payment', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const authReq = req as AuthenticatedRequest;

  // Enforce server-side administrator role verification
  if (!authReq.adminUser?.role || !['superadmin', 'staff_admin'].includes(authReq.adminUser.role)) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ROLE',
      error: 'Forbidden: Only administrators (superadmin or staff_admin) are authorized to modify payment status.'
    });
    return;
  }

  const adminActor = authReq.adminUser?.email || authReq.adminUser?.name || 'Staff Administrator';

  if (!status || !['Paid', 'Pending', 'Failed', 'Refunded'].includes(status)) {
    res.status(400).json({
      success: false,
      error: 'Valid payment status is required: Paid, Pending, Failed, or Refunded.'
    });
    return;
  }

  const updated = await db.updateOrderPaymentStatusAsync(
    id,
    status as 'Paid' | 'Pending' | 'Failed' | 'Refunded',
    adminActor,
    notes ? sanitizeText(notes) : undefined
  );

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  // If approved and marked as Paid, trigger report auto-generation and email sequence
  if (status === 'Paid') {
    handleNewOrderCreation(updated);
    triggerAutomatedEmailSequence(updated, {
      stageDelaySeconds: { stage2: 4, stage3: 8 },
      autoAdvanceOrderStatus: true
    }).catch(err => {
      console.error('[SMTP] Error starting automated email sequence on payment approval:', err);
    });
  }

  res.json({
    success: true,
    message: `Payment status for order ${updated.orderNumber} successfully set to "${status}" by ${adminActor}.`,
    data: updated
  });
});

// POST /api/orders/:id/approve-payment (convenience endpoint for manual QR payment approval)
ordersRouter.post('/:id/approve-payment', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body || {};
  const authReq = req as AuthenticatedRequest;

  // Enforce server-side administrator role verification
  if (!authReq.adminUser?.role || !['superadmin', 'staff_admin'].includes(authReq.adminUser.role)) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ROLE',
      error: 'Forbidden: Only administrators (superadmin or staff_admin) are authorized to approve payments.'
    });
    return;
  }

  const adminActor = authReq.adminUser?.email || authReq.adminUser?.name || 'Staff Administrator';

  const updated = await db.updateOrderPaymentStatusAsync(
    id,
    'Paid',
    adminActor,
    notes ? sanitizeText(notes) : 'Manual QR payment verified and confirmed by administrator.'
  );

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  handleNewOrderCreation(updated);
  triggerAutomatedEmailSequence(updated, {
    stageDelaySeconds: { stage2: 4, stage3: 8 },
    autoAdvanceOrderStatus: true
  }).catch(err => {
    console.error('[SMTP] Error on payment approval:', err);
  });

  res.json({
    success: true,
    message: `Payment confirmed for order ${updated.orderNumber}. Processing initiated.`,
    data: updated
  });
});

// POST /api/orders/:id/reject-payment (convenience endpoint for manual QR payment rejection)
ordersRouter.post('/:id/reject-payment', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const authReq = req as AuthenticatedRequest;

  // Enforce server-side administrator role verification
  if (!authReq.adminUser?.role || !['superadmin', 'staff_admin'].includes(authReq.adminUser.role)) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ROLE',
      error: 'Forbidden: Only administrators (superadmin or staff_admin) are authorized to reject payments.'
    });
    return;
  }

  const adminActor = authReq.adminUser?.email || authReq.adminUser?.name || 'Staff Administrator';

  const updated = await db.updateOrderPaymentStatusAsync(
    id,
    'Failed',
    adminActor,
    reason ? sanitizeText(reason) : 'Payment receipt could not be verified by administrator.'
  );

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    message: `Payment rejected for order ${updated.orderNumber}.`,
    data: updated
  });
});

// PATCH /api/orders/:id/status (requires staff authorization)
ordersRouter.patch('/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ success: false, error: 'Status is required.' });
    return;
  }

  const updated = await db.updateOrderStatusAsync(id, status, note ? sanitizeText(note) : undefined);

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  // Trigger corresponding stage email via Mock SMTP transporter and auto-generate report if Ready/Delivered
  if (status === 'In Progress') {
    sendMockEmail({ order: updated, type: 'processing' }).catch(err => {
      console.error('[SMTP] Error dispatching processing email:', err);
    });
  } else if (status === 'Delivered' || status === 'Ready') {
    processOrderReport(updated, { autoNotifyUser: true, targetStatus: status as 'Ready' | 'Delivered' }).catch(err => {
      console.error('[MockReportGenerator] Error auto-generating report on status change:', err);
    });
  }

  res.json({
    success: true,
    message: `Order ${updated.orderNumber} status changed to ${status}.`,
    data: updated
  });
});

// PATCH /api/orders/:id/notes (requires staff authorization)
ordersRouter.patch('/:id/notes', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (typeof notes !== 'string') {
    res.status(400).json({ success: false, error: 'Notes string is required.' });
    return;
  }

  const cleanNotes = sanitizeText(notes);
  const updated = db.updateOrderNotes(id, cleanNotes);

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    message: 'Internal notes saved.',
    data: updated
  });
});

// POST /api/orders/:id/attach-report (requires staff authorization)
ordersRouter.post('/:id/attach-report', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileName, fileUrl, type } = req.body;

  if (!fileName || !fileUrl) {
    res.status(400).json({ success: false, error: 'File name and file URL are required.' });
    return;
  }

  const updated = db.attachOrderReport(id, {
    fileName: sanitizeText(fileName),
    fileUrl: sanitizeText(fileUrl),
    type: type === 'link' || type === 'html' ? type : 'pdf'
  });

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    message: 'Report file attached successfully.',
    data: updated
  });
});
