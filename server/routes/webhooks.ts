import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { Order, AuditLog } from '../../src/types';
import { 
  triggerAutomatedEmailSequence, 
  sendAdminPaymentSubmittedAlert, 
  sendAdminNewOrderAlert 
} from '../services/smtp';
import { handleNewOrderCreation } from '../services/mockReportGenerator';

export const webhooksRouter = Router();

// Store recent webhook events in-memory for audit inspection
interface WebhookEventLog {
  id: string;
  receivedAt: string;
  provider: string;
  event: string;
  orderNumber?: string;
  orderId?: string;
  amount?: number;
  status: 'processed' | 'failed' | 'ignored';
  details: string;
}

const recentWebhookLogs: WebhookEventLog[] = [];

/**
 * GET /api/webhooks/logs
 * Retrieve recent payment provider webhook events (accessible to admin monitoring)
 */
webhooksRouter.get('/logs', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: recentWebhookLogs.length,
    data: recentWebhookLogs.slice(0, 50)
  });
});

/**
 * Helper to process payment confirmation from any provider webhook
 */
async function processPaymentCompletion(params: {
  orderIdentifier: string;
  transactionId?: string;
  amount?: number;
  paymentMethod?: string;
  provider?: string;
  rawPayload?: any;
}): Promise<{ success: boolean; order?: Order; message: string }> {
  const { orderIdentifier, transactionId, amount, paymentMethod, provider } = params;
  const cleanId = String(orderIdentifier).trim();

  // Look up order by id or orderNumber
  const orders = await db.getOrdersAsync();
  const order = orders.find(
    o => o.id === cleanId || 
         o.orderNumber.toLowerCase() === cleanId.toLowerCase() ||
         (o.payment?.gatewayRef && o.payment.gatewayRef.toLowerCase() === cleanId.toLowerCase())
  );

  if (!order) {
    return {
      success: false,
      message: `Order with identifier "${cleanId}" not found in database.`
    };
  }

  const now = new Date().toISOString();
  const txRef = transactionId || `TXN-WH-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const methodUsed = paymentMethod || (provider ? `${provider} Webhook` : 'Online Payment Gateway');

  // Update order state
  order.payment.status = 'Paid';
  order.payment.paidAt = now;
  order.payment.gatewayRef = txRef;
  order.payment.method = methodUsed;
  order.status = 'Paid / New';
  order.updatedAt = now;

  const webhookAuditLog: AuditLog = {
    id: `log-${Date.now()}-webhook`,
    timestamp: now,
    actor: `${provider || 'Payment Provider'} Webhook Listener`,
    action: 'Payment Completed via Webhook',
    details: `Confirmed payment of $${amount ?? order.total} USD. Transaction Ref: ${txRef}. Provider: ${provider || 'Gateway'}`
  };

  order.auditLogs = [webhookAuditLog, ...(order.auditLogs || [])];
  
  const webhookNote = `[${now}] Payment verified via ${provider || 'Provider'} Webhook (${txRef})`;
  order.internalNotes = order.internalNotes ? `${order.internalNotes}\n${webhookNote}` : webhookNote;

  // Persist to database
  await db.updateOrderStatus(order.id, 'Paid / New', webhookNote);
  await db.updateOrderPaymentStatus(order.id, 'Paid', webhookNote);

  // Notify Admin Dashboard and send Admin Alert
  sendAdminPaymentSubmittedAlert(order).catch(err => {
    console.error('[Webhooks] Error sending admin payment alert:', err);
  });

  // Start automated report generation and email sequence
  handleNewOrderCreation(order);
  triggerAutomatedEmailSequence(order, {
    stageDelaySeconds: { stage2: 3, stage3: 7 },
    autoAdvanceOrderStatus: true
  }).catch(err => {
    console.error('[Webhooks] Error triggering email sequence:', err);
  });

  return {
    success: true,
    order,
    message: `Payment confirmed for Order #${order.orderNumber}.`
  };
}

/**
 * POST /api/webhooks/payment
 * Universal webhook endpoint accepting events from Stripe, PayPal, Razorpay, Square, or custom gateways
 */
webhooksRouter.post('/payment', async (req: Request, res: Response) => {
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  // 1. If no secret is configured in the environment, reject all requests with HTTP 503
  if (!webhookSecret) {
    console.warn('[Webhook Listener] 503 Service Unavailable: PAYMENT_WEBHOOK_SECRET is not configured on server.');
    res.status(503).json({
      success: false,
      code: 'WEBHOOK_SECRET_NOT_CONFIGURED',
      error: 'Payment webhook handler is currently unavailable: PAYMENT_WEBHOOK_SECRET is not configured on the server.'
    });
    return;
  }

  // 2. Only support shared-secret header for now.
  // Note: Real provider webhook signature verification (e.g. Stripe, PayPal, Razorpay HMAC) requires verifying against the unparsed raw request body buffer before JSON parsing.
  const providedSecret = 
    (req.headers['x-webhook-secret'] as string) || 
    (req.headers['x-api-key'] as string);

  if (!providedSecret) {
    console.warn('[Webhook Listener] 401 Unauthorized: Missing shared secret in request headers.');
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing required shared-secret header (x-webhook-secret).'
    });
    return;
  }

  // Compare secrets with timingSafeEqual on equal-length SHA-256 hashes so a wrong-length value returns 401, never a 500
  const expectedHash = crypto.createHash('sha256').update(String(webhookSecret)).digest();
  const providedHash = crypto.createHash('sha256').update(String(providedSecret)).digest();
  const isValid = crypto.timingSafeEqual(expectedHash, providedHash);

  if (!isValid) {
    console.warn('[Webhook Listener] 401 Unauthorized: Shared secret mismatch.');
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid webhook shared secret.'
    });
    return;
  }

  const payload = req.body || {};
  const eventType = payload.type || payload.event || payload.action || 'payment.succeeded';
  const provider = req.headers['x-payment-provider'] as string || payload.provider || 'PaymentProvider';

  console.log(`[Webhook Listener] Received authenticated webhook: [${provider}] event="${eventType}"`);

  // Detect order identifier from multiple standard payment webhook formats
  const orderIdentifier = 
    payload.orderId || 
    payload.orderNumber || 
    payload.order_id || 
    payload.metadata?.orderId || 
    payload.metadata?.orderNumber ||
    payload.data?.object?.metadata?.orderId ||
    payload.data?.object?.metadata?.orderNumber ||
    payload.data?.object?.client_reference_id ||
    payload.resource?.custom ||
    payload.reference;

  const transactionId = 
    payload.transactionId || 
    payload.id || 
    payload.data?.object?.id || 
    payload.resource?.id ||
    `TXN-${Date.now()}`;

  const amount = 
    payload.amount ? Number(payload.amount) :
    payload.data?.object?.amount ? Number(payload.data.object.amount) / 100 :
    payload.resource?.amount?.value ? Number(payload.resource.amount.value) :
    undefined;

  const paymentMethod = 
    payload.paymentMethod || 
    payload.data?.object?.payment_method_types?.[0] || 
    'Direct Card / Gateway';

  // Check event type for success/completion
  const isCompletionEvent = 
    eventType.includes('succeeded') || 
    eventType.includes('completed') || 
    eventType.includes('paid') ||
    eventType === 'checkout.session.completed' ||
    eventType === 'payment_intent.succeeded' ||
    eventType === 'PAYMENT.CAPTURE.COMPLETED';

  if (!isCompletionEvent) {
    const log: WebhookEventLog = {
      id: `wh-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      provider,
      event: eventType,
      orderNumber: orderIdentifier,
      status: 'ignored',
      details: `Ignored non-completion event "${eventType}".`
    };
    recentWebhookLogs.unshift(log);

    res.json({
      received: true,
      status: 'ignored',
      message: `Event ${eventType} acknowledged without status update.`
    });
    return;
  }

  if (!orderIdentifier) {
    const log: WebhookEventLog = {
      id: `wh-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      provider,
      event: eventType,
      status: 'failed',
      details: 'Missing orderId or orderNumber in webhook payload.'
    };
    recentWebhookLogs.unshift(log);

    res.status(400).json({
      received: true,
      success: false,
      error: 'Missing orderId or orderNumber in webhook payload.'
    });
    return;
  }

  try {
    const result = await processPaymentCompletion({
      orderIdentifier,
      transactionId,
      amount,
      paymentMethod,
      provider,
      rawPayload: payload
    });

    const log: WebhookEventLog = {
      id: `wh-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      provider,
      event: eventType,
      orderNumber: result.order?.orderNumber || orderIdentifier,
      orderId: result.order?.id,
      amount: amount || result.order?.total,
      status: result.success ? 'processed' : 'failed',
      details: result.message
    };
    recentWebhookLogs.unshift(log);

    if (!result.success) {
      res.status(404).json({
        received: true,
        success: false,
        error: result.message
      });
      return;
    }

    res.json({
      received: true,
      success: true,
      orderNumber: result.order?.orderNumber,
      orderId: result.order?.id,
      paymentStatus: 'Paid',
      message: result.message
    });
  } catch (err: any) {
    console.error('[Webhooks] Exception processing payment webhook:', err);
    res.status(500).json({
      received: true,
      success: false,
      error: err?.message || 'Server error processing payment webhook.'
    });
  }
});

/**
 * POST /api/webhooks/simulate-payment
 * Simulation endpoint for manual testing or automated frontend polling checkout simulation
 */
webhooksRouter.post('/simulate-payment', async (req: Request, res: Response) => {
  const { orderId, orderNumber, paymentMethod, delayMs } = req.body;
  const targetIdentifier = orderId || orderNumber;

  if (!targetIdentifier) {
    res.status(400).json({ success: false, error: 'orderId or orderNumber is required.' });
    return;
  }

  const delay = Math.min(Number(delayMs) || 0, 15000);

  const execute = async () => {
    return await processPaymentCompletion({
      orderIdentifier: targetIdentifier,
      transactionId: `SIM-TXN-${Date.now()}`,
      paymentMethod: paymentMethod || 'Instant Card Authorization (Simulated Webhook)',
      provider: 'Gateway-Webhook-Simulator'
    });
  };

  if (delay > 0) {
    // Schedule asynchronous execution after delay
    setTimeout(async () => {
      try {
        await execute();
      } catch (err) {
        console.error('[Webhook Simulator] Delayed execution error:', err);
      }
    }, delay);

    res.json({
      success: true,
      message: `Payment webhook scheduled to confirm order in ${delay}ms.`
    });
  } else {
    const result = await execute();
    res.json(result);
  }
});
