import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { supabaseDb } from '../supabase';
import { requireAdminAuth } from '../middleware/auth';
import { Order, AuditLog, EmailNotification } from '../../src/types';
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
  await supabaseDb.checkTablesHealth();
  const status = db.getDatabaseStatus();
  res.json({
    success: true,
    database: status,
    instructions: {
      supabaseConfigured: status.isSupabaseConnected,
      tablesReady: status.tablesReady,
      help: status.isSupabaseConnected && !status.tablesReady
        ? "Your Supabase project is connected, but the PostgreSQL tables ('orders', etc.) are not created yet in the database. Run the script in /supabase/schema.sql in your Supabase SQL Editor."
        : "PostgreSQL tables are verified and operational."
    }
  });
});

// GET /api/orders/schema-sql (returns the raw SQL schema for one-click setup)
ordersRouter.get('/schema-sql', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).send('-- schema.sql not found');
    }
  } catch (err: any) {
    res.status(500).send(`-- Error: ${err.message}`);
  }
});

// GET /api/orders (admin & customer lookup)
// If email query is provided: customer self-service lookup for their own orders
// If no email query: require staff authorization
ordersRouter.get('/', (req: Request, res: Response) => {
  const { email, status, search } = req.query;

  // Protect all-order retrieval with admin authentication
  if (!email) {
    return requireAdminAuth(req, res, () => {
      let orders = db.getOrders();

      if (status && typeof status === 'string' && status !== 'all') {
        orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
      }

      if (search && typeof search === 'string') {
        const term = search.trim().toLowerCase();
        orders = orders.filter(o => 
          o.orderNumber.toLowerCase().includes(term) ||
          o.customer.fullName.toLowerCase().includes(term) ||
          o.customer.email.toLowerCase().includes(term) ||
          o.vehicle.vinOrReg.toLowerCase().includes(term) ||
          o.vehicle.make.toLowerCase().includes(term) ||
          o.vehicle.model.toLowerCase().includes(term)
        );
      }

      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    });
  }

  // Customer self-service: strictly scoped to matching email
  const cleanEmail = String(email).trim().toLowerCase();
  let customerOrders = db.getOrders().filter(o => o.customer.email.toLowerCase() === cleanEmail);

  if (search && typeof search === 'string') {
    const term = search.trim().toLowerCase();
    customerOrders = customerOrders.filter(o =>
      o.orderNumber.toLowerCase().includes(term) ||
      o.vehicle.vinOrReg.toLowerCase().includes(term) ||
      o.vehicle.make.toLowerCase().includes(term) ||
      o.vehicle.model.toLowerCase().includes(term)
    );
  }

  res.json({
    success: true,
    count: customerOrders.length,
    data: customerOrders
  });
});

// GET /api/orders/:id
ordersRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    data: order
  });
});

// POST /api/orders
ordersRouter.post('/', (req: Request, res: Response) => {
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
    res.status(422).json({ success: false, error: 'Customer full name must be at least 2 characters.' });
    return;
  }

  if (!body.vehicle?.vinOrReg) {
    res.status(400).json({ success: false, error: 'Vehicle VIN or Registration is required.' });
    return;
  }

  const rawVin = sanitizeText(body.vehicle.vinOrReg).toUpperCase();
  const isVin = body.vehicle.isVin !== false;

  if (isVin && !VIN_REGEX.test(rawVin)) {
    res.status(422).json({
      success: false,
      error: 'Invalid 17-digit VIN. VIN must be exactly 17 alphanumeric characters (excluding letters I, O, and Q).'
    });
    return;
  }

  const service = db.getServiceById(body.serviceId);
  const subtotal = service ? service.price : (body.subtotal || 28.99);

  let discountAmount = 0;
  let couponCode = body.couponCode?.trim().toUpperCase();

  if (couponCode) {
    const validation = db.validateCoupon(couponCode);
    if (validation.valid && validation.coupon) {
      if (validation.coupon.discountPercent) {
        discountAmount = parseFloat(((subtotal * validation.coupon.discountPercent) / 100).toFixed(2));
      } else if (validation.coupon.discountFixed) {
        discountAmount = Math.min(validation.coupon.discountFixed, subtotal);
      }
      db.incrementCouponUsage(couponCode);
    } else {
      couponCode = undefined;
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
      fullName: body.customer.fullName,
      email: body.customer.email,
      phone: body.customer.phone || '',
      smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true
    },
    smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true,
    vehicle: {
      vinOrReg: body.vehicle.vinOrReg.toUpperCase(),
      isVin: body.vehicle.isVin !== false,
      make: body.vehicle.make || 'Verified',
      model: body.vehicle.model || 'Series',
      year: body.vehicle.year || new Date().getFullYear(),
      mileage: body.vehicle.mileage || 'Pending audit',
      countryOrState: body.vehicle.countryOrState || 'US',
      customerNotes: body.vehicle.customerNotes || ''
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

  db.createOrder(newOrder);

  // Trigger Mock Report Generator Service (triggers when order is Paid)
  handleNewOrderCreation(newOrder);

  // Trigger automated mock SMTP email sequence (Confirmation -> In-Progress -> Ready)
  triggerAutomatedEmailSequence(newOrder, {
    stageDelaySeconds: { stage2: 4, stage3: 8 },
    autoAdvanceOrderStatus: true
  }).catch(err => {
    console.error('[SMTP] Automated email sequence error:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully and automated lifecycle email sequence initiated.',
    data: newOrder
  });
});

// PATCH /api/orders/:id/status (requires staff authorization)
ordersRouter.patch('/:id/status', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ success: false, error: 'Status is required.' });
    return;
  }

  const updated = db.updateOrderStatus(id, status, note ? sanitizeText(note) : undefined);

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
