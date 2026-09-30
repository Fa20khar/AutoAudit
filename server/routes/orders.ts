import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Order, AuditLog, EmailNotification } from '../../src/types';

export const ordersRouter = Router();

// GET /api/orders (admin & customer lookup)
ordersRouter.get('/', (req: Request, res: Response) => {
  const { email, status, search } = req.query;
  let orders = db.getOrders();

  if (email && typeof email === 'string') {
    const cleanEmail = email.trim().toLowerCase();
    orders = orders.filter(o => o.customer.email.toLowerCase() === cleanEmail);
  }

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
  if (!body.vehicle?.vinOrReg) {
    res.status(400).json({ success: false, error: 'Vehicle VIN or Registration is required.' });
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
      phone: body.customer.phone || ''
    },
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

  // Send confirmation email
  const confirmationEmail: EmailNotification = {
    id: `em-${Date.now()}`,
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    recipientEmail: newOrder.customer.email,
    recipientType: 'customer',
    subject: `Order Confirmed: ${newOrder.serviceName} (${newOrder.orderNumber})`,
    type: 'order_confirmation',
    body: `Hello ${newOrder.customer.fullName},\n\nWe have received your order for vehicle ${newOrder.vehicle.year} ${newOrder.vehicle.make} ${newOrder.vehicle.model} (VIN/Reg: ${newOrder.vehicle.vinOrReg}). Your reference number is ${newOrder.orderNumber}.\n\nOur system is running checks across NMVTIS databases and salvage auctions. You will receive an email as soon as your report is ready.`,
    sentAt: now,
    read: false
  };
  db.addEmail(confirmationEmail);

  res.status(201).json({
    success: true,
    message: 'Order created successfully and sent to processing queue.',
    data: newOrder
  });
});

// PATCH /api/orders/:id/status
ordersRouter.patch('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ success: false, error: 'Status is required.' });
    return;
  }

  const updated = db.updateOrderStatus(id, status, note);

  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }

  // If delivered, send report email
  if (status === 'Delivered' || status === 'Ready') {
    const readyEmail: EmailNotification = {
      id: `em-${Date.now()}`,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      recipientEmail: updated.customer.email,
      recipientType: 'customer',
      subject: `Your AutoAudit Report is Ready (${updated.orderNumber})`,
      type: 'report_ready',
      body: `Hello ${updated.customer.fullName},\n\nYour verified AutoAudit vehicle history report for ${updated.vehicle.year} ${updated.vehicle.make} ${updated.vehicle.model} is now ready for download.\n\nOrder Number: ${updated.orderNumber}\nFile: AutoAudit_Report_${updated.vehicle.vinOrReg}.pdf`,
      sentAt: new Date().toISOString(),
      read: false
    };
    db.addEmail(readyEmail);
  }

  res.json({
    success: true,
    message: `Order ${updated.orderNumber} status changed to ${status}.`,
    data: updated
  });
});
