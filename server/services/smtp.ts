import nodemailer from 'nodemailer';
import { Order, EmailNotification } from '../../src/types';
import { db } from '../db';

/**
 * AutoAudit Mock SMTP Service Handler powered by Nodemailer.
 * Uses Nodemailer's built-in JSON transport for instant, zero-timeout mock delivery in dev/cloud sandbox,
 * with optional fallback to real SMTP if SMTP_HOST is defined in environment variables.
 */

const isRealSmtp = Boolean(process.env.SMTP_HOST);

const transporter = isRealSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || ''
      } : undefined
    })
  : nodemailer.createTransport({
      jsonTransport: true
    });

const SYSTEM_FROM_EMAIL = process.env.SMTP_FROM || 'AutoAudit Notifications <noreply@autoaudit.intelligence>';

/**
 * Generate branded HTML templates for customer notifications
 */
function generateEmailHtml(order: Order, type: 'order_confirmation' | 'processing' | 'report_ready'): { subject: string; html: string; text: string } {
  const vehicleName = `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`;
  const vin = order.vehicle.vinOrReg;
  const orderNum = order.orderNumber;
  const customerName = order.customer.fullName;

  if (type === 'order_confirmation') {
    const subject = `Order Confirmed: AutoAudit Report for ${vin} (${orderNum})`;
    const text = `Hello ${customerName},\n\nThank you for choosing AutoAudit! Your order #${orderNum} for ${vehicleName} (VIN: ${vin}) has been confirmed and payment has been processed successfully ($${order.total.toFixed(2)} USD).\n\nOur automated systems are now querying the NMVTIS federal title clearinghouse, 50-state DMV registries, and salvage auto auctions.\n\nWe will notify you the moment your report advances to processing.`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0b132b; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; font-family: monospace; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .order-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
    .order-row:last-child { margin-bottom: 0; padding-top: 8px; border-top: 1px solid #e2e8f0; font-weight: 700; }
    .steps { margin: 24px 0; border-left: 2px solid #2563eb; padding-left: 16px; }
    .step { font-size: 12px; margin-bottom: 12px; }
    .step strong { display: block; font-size: 13px; color: #0b132b; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoAudit™ Vehicle Intelligence</h1>
      <p>ORDER REFERENCE: ${orderNum}</p>
    </div>
    <div class="body">
      <span class="badge">Stage 1 of 3: Order Confirmed</span>
      <h2 style="font-size: 18px; margin-top: 14px; margin-bottom: 10px;">Payment Verified & Audit Queued</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        We have confirmed your report request for <strong>${vehicleName}</strong>. Our automated vehicle intelligence engine is connecting to NMVTIS federal title clearinghouses and insurance databases.
      </p>

      <div class="order-box">
        <div class="order-row"><span>Order Number:</span><span style="font-family: monospace;">${orderNum}</span></div>
        <div class="order-row"><span>Chassis VIN:</span><span style="font-family: monospace; font-weight: 700; color: #2563eb;">${vin}</span></div>
        <div class="order-row"><span>Service Tier:</span><span>${order.serviceName}</span></div>
        <div class="order-row"><span>Total Paid:</span><span>$${order.total.toFixed(2)} USD</span></div>
      </div>

      <div class="steps">
        <div class="step">
          <strong style="color: #059669;">✓ Step 1: Payment Confirmed</strong>
          Transaction authorized and validated.
        </div>
        <div class="step">
          <strong style="color: #2563eb;">⚡ Step 2: Multi-Registry Query (In-Progress)</strong>
          Scanning 50 US State DMVs, insurance total-loss databases, and salvage auctions.
        </div>
        <div class="step">
          <strong style="color: #64748b;">⏳ Step 3: Official Report Delivery (Upcoming)</strong>
          You will receive your sealed report with download and print access shortly.
        </div>
      </div>
    </div>
    <div class="footer">
      AutoAudit Technologies Inc. · Cryptographic Vehicle Intelligence · All Rights Reserved
    </div>
  </div>
</body>
</html>`;
    return { subject, html, text };
  }

  if (type === 'processing') {
    const subject = `Audit In Progress: Compiling DMV Records for ${vin} (${orderNum})`;
    const text = `Hello ${customerName},\n\nYour vehicle audit for ${vehicleName} (VIN: ${vin}) is currently IN-PROGRESS.\n\nOur systems are actively analyzing records from the National Motor Vehicle Title Information System (NMVTIS), municipal salvage auctions, flood registries, and certified odometer databases.\n\nNo manual action is required. We will send you a final email as soon as your PDF report is compiled.`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #1e3a8a; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #bfdbfe; font-family: monospace; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .status-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .checklist { list-style: none; padding: 0; margin: 16px 0; }
    .checklist li { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoAudit™ Vehicle Intelligence</h1>
      <p>PROCESSING UPDATE: ${orderNum}</p>
    </div>
    <div class="body">
      <span class="badge">Stage 2 of 3: Audit In Progress</span>
      <h2 style="font-size: 18px; margin-top: 14px; margin-bottom: 10px;">Aggregating Federal & State Clearinghouse Records</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Our data clearinghouse pipeline is actively analyzing historical records for your <strong>${vehicleName}</strong> (VIN: <span style="font-family: monospace; font-weight: 700;">${vin}</span>).
      </p>

      <div class="status-card">
        <strong style="color: #15803d; font-size: 13px;">Live Diagnostic Checkpoints:</strong>
        <ul class="checklist">
          <li>✓ NMVTIS Title Brand Registry: Connected</li>
          <li>✓ Federal Odometer Act Timeline: Analysis underway</li>
          <li>✓ Insurance Total Loss & Salvage Inquiries: Queued</li>
          <li>✓ Open Safety Recall Cross-Check: Querying NHTSA database</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Final cryptographic report generation is finishing up. You will receive an immediate notification once your document is ready for download and paper printing.
      </p>
    </div>
    <div class="footer">
      AutoAudit Technologies Inc. · Cryptographic Vehicle Intelligence · All Rights Reserved
    </div>
  </div>
</body>
</html>`;
    return { subject, html, text };
  }

  // report_ready
  const subject = `Your AutoAudit Report is Ready (${orderNum})`;
  const text = `Hello ${customerName},\n\nGreat news! Your AutoAudit Vehicle History Report for ${vehicleName} (VIN: ${vin}) has been successfully compiled and certified.\n\nSummary Findings:\n- Title Brands: Clean (0 reported)\n- Severe Accidents: 0 reported\n- Odometer: Actual Mileage Verified\n- Safety Recalls: 0 Open Recalls\n\nYou can view, download, and print your official report immediately through the AutoAudit Customer Dashboard using Order Number: ${orderNum}.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #065f46; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #a7f3d0; font-family: monospace; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
    .metric-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .metric-value { font-size: 14px; font-weight: 800; color: #065f46; margin-top: 4px; }
    .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 16px 0; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoAudit™ Vehicle Intelligence</h1>
      <p>REPORT READY: ${orderNum}</p>
    </div>
    <div class="body">
      <span class="badge">Stage 3 of 3: Report Certified</span>
      <h2 style="font-size: 18px; margin-top: 14px; margin-bottom: 10px;">Official Vehicle History Record Available</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Your comprehensive vehicle history audit for <strong>${vehicleName}</strong> (VIN: <span style="font-family: monospace; font-weight: 700;">${vin}</span>) has completed all clearinghouse cross-checks and is sealed.
      </p>

      <div class="grid">
        <div class="metric-card">
          <div class="metric-title">Title Brands</div>
          <div class="metric-value">Clean (0 Brands)</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Accident History</div>
          <div class="metric-value">0 Severe Reported</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Odometer Audit</div>
          <div class="metric-value">Actual Mileage Verified</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Safety Recalls</div>
          <div class="metric-value">0 Open NHTSA Recalls</div>
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">You can view and generate a paper copy directly:</p>
        <span class="cta-btn">✓ View & Print Vehicle Report</span>
      </div>

      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 14px;">
        Order Reference: <strong>${orderNum}</strong> &nbsp;|&nbsp; File: <code>AutoAudit_Report_${vin}.html</code>
      </p>
    </div>
    <div class="footer">
      AutoAudit Technologies Inc. · Cryptographic Vehicle Intelligence · All Rights Reserved
    </div>
  </div>
</body>
</html>`;
  return { subject, html, text };
}

/**
 * Dispatches an individual email through the Nodemailer mock SMTP transporter
 * and records it to the database store.
 */
export async function sendMockEmail(params: {
  order: Order;
  type: 'order_confirmation' | 'processing' | 'report_ready';
}): Promise<{ success: boolean; messageId: string; email: EmailNotification }> {
  const { order, type } = params;
  const { subject, html, text } = generateEmailHtml(order, type);

  const mailOptions = {
    from: SYSTEM_FROM_EMAIL,
    to: order.customer.email,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  const messageId = info.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const notification: EmailNotification = {
    id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientEmail: order.customer.email,
    recipientType: 'customer',
    subject,
    type,
    body: text,
    htmlBody: html,
    messageId,
    smtpTransport: isRealSmtp ? 'Live SMTP' : 'Nodemailer Mock SMTP (JSON Transporter)',
    sentAt: new Date().toISOString(),
    read: false
  };

  db.addEmail(notification);
  console.log(`[SMTP] Sent ${type} email to ${order.customer.email} (MessageId: ${messageId})`);

  return {
    success: true,
    messageId,
    email: notification
  };
}

/**
 * Automated Lifecycle Email Sequence Orchestrator
 * Stage 1: Order Confirmation (Immediate)
 * Stage 2: In-Progress DMV Audit (Automated 3-4s delay)
 * Stage 3: Ready / Delivered (Automated 7-8s delay)
 */
export async function triggerAutomatedEmailSequence(
  order: Order,
  options?: {
    stageDelaySeconds?: { stage2?: number; stage3?: number };
    autoAdvanceOrderStatus?: boolean;
  }
): Promise<{ success: boolean; confirmationMessageId: string }> {
  const stage2Delay = options?.stageDelaySeconds?.stage2 ?? 4;
  const stage3Delay = options?.stageDelaySeconds?.stage3 ?? 8;
  const autoAdvance = options?.autoAdvanceOrderStatus ?? true;

  // STAGE 1: Immediate Order Confirmation
  const stage1Result = await sendMockEmail({ order, type: 'order_confirmation' });

  // STAGE 2: Automated In-Progress Stage
  setTimeout(async () => {
    try {
      const currentOrder = db.getOrderById(order.id) || order;
      if (autoAdvance && currentOrder.status === 'Paid / New') {
        db.updateOrderStatus(
          currentOrder.id,
          'In Progress',
          'Automated clearinghouse lookup started across 50 state DMVs and NMVTIS.'
        );
      }
      await sendMockEmail({ order: currentOrder, type: 'processing' });
    } catch (err) {
      console.error('[SMTP] Error sending Stage 2 processing email:', err);
    }
  }, stage2Delay * 1000);

  // STAGE 3: Automated Ready / Delivery Stage
  setTimeout(async () => {
    try {
      const currentOrder = db.getOrderById(order.id) || order;
      if (autoAdvance) {
        db.updateOrderStatus(
          currentOrder.id,
          'Delivered',
          'Automated vehicle history report assembled and verified.'
        );
      }
      await sendMockEmail({ order: currentOrder, type: 'report_ready' });
    } catch (err) {
      console.error('[SMTP] Error sending Stage 3 report ready email:', err);
    }
  }, stage3Delay * 1000);

  return {
    success: true,
    confirmationMessageId: stage1Result.messageId
  };
}

export function getSmtpStatus() {
  return {
    service: 'AutoAudit Automated Mock SMTP Engine',
    library: 'Nodemailer',
    version: '6.x',
    mode: isRealSmtp ? 'Live SMTP Transport' : 'Mock JSON Transporter (Zero-Network Latency)',
    sender: SYSTEM_FROM_EMAIL,
    totalDispatched: db.getEmails().length
  };
}
