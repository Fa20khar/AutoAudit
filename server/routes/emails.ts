import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAdminAuth } from '../middleware/auth';
import { triggerAutomatedEmailSequence, sendMockEmail, getSmtpStatus } from '../services/smtp';

export const emailsRouter = Router();

// GET /api/emails/smtp-status (Returns Nodemailer mock SMTP transporter health & config)
emailsRouter.get('/smtp-status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getSmtpStatus()
  });
});

// GET /api/emails (Customer can filter by ?email=..., staff can view all)
emailsRouter.get('/', (req: Request, res: Response) => {
  const { email, orderNumber } = req.query;

  // If customer requests their own emails
  if (typeof email === 'string' && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const customerEmails = db.getEmails().filter(e => e.recipientEmail.toLowerCase() === cleanEmail);
    res.json({
      success: true,
      count: customerEmails.length,
      data: customerEmails
    });
    return;
  }

  // If filtered by order number
  if (typeof orderNumber === 'string' && orderNumber.trim()) {
    const cleanNum = orderNumber.trim().toUpperCase();
    const orderEmails = db.getEmails().filter(e => e.orderNumber.toUpperCase() === cleanNum);
    res.json({
      success: true,
      count: orderEmails.length,
      data: orderEmails
    });
    return;
  }

  // Otherwise, require staff authorization to view all customer emails
  requireAdminAuth(req, res, () => {
    res.json({
      success: true,
      count: db.getEmails().length,
      data: db.getEmails()
    });
  });
});

// POST /api/emails/trigger-sequence/:orderId (Triggers automated 3-stage email sequence)
emailsRouter.post('/trigger-sequence/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrderById(orderId);

  if (!order) {
    res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
    return;
  }

  try {
    const result = await triggerAutomatedEmailSequence(order, {
      stageDelaySeconds: { stage2: 3, stage3: 7 },
      autoAdvanceOrderStatus: true
    });

    res.json({
      success: true,
      message: `Automated lifecycle email sequence initiated for ${order.customer.email}.`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipient: order.customer.email,
        confirmationMessageId: result.confirmationMessageId,
        stages: ['Stage 1: Confirmation (Sent)', 'Stage 2: In-Progress (Scheduled in 3s)', 'Stage 3: Ready (Scheduled in 7s)']
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to trigger email sequence: ${err?.message || 'SMTP Error'}`
    });
  }
});

// POST /api/emails/send-stage (Manually dispatch an individual stage email)
emailsRouter.post('/send-stage', requireAdminAuth, async (req: Request, res: Response) => {
  const { orderId, type } = req.body;

  if (!orderId || !type) {
    res.status(400).json({ success: false, error: 'Both orderId and type are required.' });
    return;
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
    return;
  }

  if (type !== 'order_confirmation' && type !== 'processing' && type !== 'report_ready') {
    res.status(400).json({ success: false, error: 'Invalid email stage type.' });
    return;
  }

  try {
    const result = await sendMockEmail({ order, type });
    res.json({
      success: true,
      message: `${type} email successfully dispatched via mock SMTP.`,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to dispatch email: ${err?.message || 'SMTP Error'}`
    });
  }
});
