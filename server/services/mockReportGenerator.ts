import { Order, OrderFile } from '../../src/types/index';
import { db } from '../db';
import { sendMockEmail } from './smtp';

/**
 * In-memory cache for auto-generated dummy report PDF buffers
 * Keyed by orderId and orderNumber for instant zero-latency retrieval
 */
interface CachedReport {
  buffer: Buffer;
  fileName: string;
  generatedAt: string;
}

const pdfCache = new Map<string, CachedReport>();

/**
 * Generates an authentic, valid PDF-1.4 binary buffer containing
 * official AutoAudit vehicle history findings, NMVTIS database checks,
 * odometer progression, and cryptographic verification seals.
 */
export function generateDummyPdfBuffer(order: Order): Buffer {
  const vehicleName = `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`.trim();
  const vin = (order.vehicle.vinOrReg || 'UNKNOWN_VIN').toUpperCase();
  const orderNum = order.orderNumber || 'AA-10000';
  const customerName = order.customer.fullName || 'Valued Customer';
  const customerEmail = order.customer.email || 'customer@example.com';
  const mileage = order.vehicle.mileage || '41,800 mi (Verified)';
  const jurisdiction = order.vehicle.countryOrState || 'California, USA';
  const serviceTier = order.serviceName || 'Comprehensive Vehicle History Report';
  const generatedTimestamp = new Date().toUTCString();

  // Helper to escape PDF string literals
  const esc = (text: string) => {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  };

  // Build PDF stream operators
  const lines: string[] = [
    // Graphic background bar for top header
    '0.043 0.075 0.169 rg', // Navy #0B132B
    '0 712 612 80 re',
    'f',

    // Gold accent separator line
    '0.96 0.62 0.07 rg', // Amber #F59E0B
    '0 708 612 4 re',
    'f',

    // Text: Document Title in White
    'BT',
    '/F1 18 Tf',
    '1 1 1 rg', // White
    '40 754 Td',
    `(${esc('AUTOAUDIT VEHICLE INTELLIGENCE REPORT')}) Tj`,
    'ET',

    // Subtitle
    'BT',
    '/F2 9 Tf',
    '0.7 0.75 0.85 rg',
    '40 732 Td',
    `(${esc('Certified NMVTIS National Clearinghouse & 50-State DMV Verification Record')}) Tj`,
    'ET',

    // Order number badge on right
    'BT',
    '/F1 11 Tf',
    '1 1 1 rg',
    '440 746 Td',
    `(${esc(`REF: ${orderNum}`)}) Tj`,
    'ET',

    // Watermark behind content (using standard PDF 1.4 text transformation matrix)
    'BT',
    '/F1 32 Tf',
    '0.93 0.94 0.96 rg', // Very faint grey
    '0.866 0.5 -0.5 0.866 110 440 Tm',
    `(${esc('OFFICIAL AUTOAUDIT REPORT')}) Tj`,
    'ET',

    // Clean Title Verified Ribbon
    '0.925 0.988 0.957 rg', // Emerald light bg
    '0.05 0.6 0.4 RG',      // Emerald border
    '1 w',
    '40 655 532 38 re',
    'B',

    'BT',
    '/F1 12 Tf',
    '0.02 0.37 0.27 rg', // Emerald dark text
    '52 671 Td',
    `(${esc('STATUS: CLEAN TITLE CERTIFIED  -  0 TOTAL LOSS OR SALVAGE BRANDS')}) Tj`,
    'ET',

    'BT',
    '/F2 8.5 Tf',
    '0.2 0.45 0.35 rg',
    '52 660 Td',
    `(${esc('All 50 US State Registries, FEMA Flood Databases, and Insurance Clearinghouses Checked')}) Tj`,
    'ET',

    // Vehicle Specification Box
    '0.97 0.98 0.99 rg',
    '0.88 0.91 0.94 RG',
    '0.75 w',
    '40 540 532 100 re',
    'B',

    'BT',
    '/F1 10 Tf',
    '0.1 0.15 0.25 rg',
    '52 622 Td',
    `(${esc('VEHICLE IDENTIFICATION & AUDIT SPECIFICATIONS')}) Tj`,
    'ET',

    // Metadata items (2 columns)
    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.4 rg',
    '52 602 Td',
    `(${esc(`Vehicle: ${vehicleName}`)}) Tj`,
    '0 -15 Td',
    `(${esc(`VIN / Chassis: ${vin}`)}) Tj`,
    '0 -15 Td',
    `(${esc(`Current Odometer: ${mileage}`)}) Tj`,
    '0 -15 Td',
    `(${esc(`Jurisdiction: ${jurisdiction}`)}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.4 rg',
    '320 602 Td',
    `(${esc(`Customer: ${customerName}`)}) Tj`,
    '0 -15 Td',
    `(${esc(`Account Email: ${customerEmail}`)}) Tj`,
    '0 -15 Td',
    `(${esc(`Audit Tier: ${serviceTier}`)}) Tj`,
    '0 -15 Td',
    `(${esc(`Certified At: ${generatedTimestamp}`)}) Tj`,
    'ET',

    // Section 1: Title Brand & Loss History Table
    'BT',
    '/F1 11 Tf',
    '0.05 0.1 0.2 rg',
    '40 515 Td',
    `(${esc('1. STATE TITLE BRAND & TOTAL LOSS CLEARINGHOUSE FINDINGS')}) Tj`,
    'ET',

    // Table Header Row
    '0.94 0.96 0.98 rg',
    '0.85 0.88 0.92 RG',
    '0.5 w',
    '40 488 532 18 re',
    'B',

    'BT',
    '/F1 8.5 Tf',
    '0.2 0.25 0.3 rg',
    '48 493 Td',
    `(${esc('DATABASE REGISTRY')}) Tj`,
    '150 0 Td',
    `(${esc('REPORTING SOURCE')}) Tj`,
    '160 0 Td',
    `(${esc('RESULT')}) Tj`,
    '70 0 Td',
    `(${esc('DETAILS')}) Tj`,
    'ET',

    // Rows
    'BT',
    '/F2 8 Tf',
    '0.15 0.2 0.25 rg',
    // Row 1
    '48 472 Td',
    `(${esc('Salvage / Total Loss')}) Tj`,
    '150 0 Td',
    `(${esc('Insurance Clearinghouses & Auctions')}) Tj`,
    '160 0 Td',
    `(${esc('PASSED')}) Tj`,
    '70 0 Td',
    `(${esc('No total loss claims or auction transfers')}) Tj`,
    // Row 2
    '-380 -16 Td',
    `(${esc('Flood / Water Damage')}) Tj`,
    '150 0 Td',
    `(${esc('FEMA Emergency Registries & DMVs')}) Tj`,
    '160 0 Td',
    `(${esc('PASSED')}) Tj`,
    '70 0 Td',
    `(${esc('Zero flood or storm damage flags')}) Tj`,
    // Row 3
    '-380 -16 Td',
    `(${esc('Junk / Dismantler Record')}) Tj`,
    '150 0 Td',
    `(${esc('NMVTIS National Motor Clearinghouse')}) Tj`,
    '160 0 Td',
    `(${esc('PASSED')}) Tj`,
    '70 0 Td',
    `(${esc('Vehicle never scrapped or crushed')}) Tj`,
    // Row 4
    '-380 -16 Td',
    `(${esc('Stolen Vehicle Registry')}) Tj`,
    '150 0 Td',
    `(${esc('NICB & Federal Law Enforcement')}) Tj`,
    '160 0 Td',
    `(${esc('PASSED')}) Tj`,
    '70 0 Td',
    `(${esc('No active police theft records')}) Tj`,
    // Row 5
    '-380 -16 Td',
    `(${esc('Safety Recall Registry')}) Tj`,
    '150 0 Td',
    `(${esc('NHTSA Federal Safety Bureau')}) Tj`,
    '160 0 Td',
    `(${esc('PASSED')}) Tj`,
    '70 0 Td',
    `(${esc('0 open safety recalls requiring repair')}) Tj`,
    'ET',

    // Section 2: Odometer Progression
    'BT',
    '/F1 11 Tf',
    '0.05 0.1 0.2 rg',
    '40 375 Td',
    `(${esc('2. CERTIFIED ODOMETER TIMELINE & INTEGRITY AUDIT')}) Tj`,
    'ET',

    // Table Header
    '0.94 0.96 0.98 rg',
    '0.85 0.88 0.92 RG',
    '0.5 w',
    '40 348 532 18 re',
    'B',

    'BT',
    '/F1 8.5 Tf',
    '0.2 0.25 0.3 rg',
    '48 353 Td',
    `(${esc('READING DATE')}) Tj`,
    '120 0 Td',
    `(${esc('MILEAGE')}) Tj`,
    '100 0 Td',
    `(${esc('RECORDING FACILITY')}) Tj`,
    '160 0 Td',
    `(${esc('AUDIT STATUS')}) Tj`,
    'ET',

    // Odometer Rows
    'BT',
    '/F2 8 Tf',
    '0.15 0.2 0.25 rg',
    '48 332 Td',
    `(${esc('11/14/2021')}) Tj`,
    '120 0 Td',
    `(${esc('12 mi')}) Tj`,
    '100 0 Td',
    `(${esc('Authorized Dealer Network')}) Tj`,
    '160 0 Td',
    `(${esc('Pre-Delivery Inspection (Certified)')}) Tj`,
    '-380 -16 Td',
    `(${esc('10/05/2023')}) Tj`,
    '120 0 Td',
    `(${esc('18,420 mi')}) Tj`,
    '100 0 Td',
    `(${esc('State DMV Registration Bureau')}) Tj`,
    '160 0 Td',
    `(${esc('Registration Renewal (Steady)')}) Tj`,
    '-380 -16 Td',
    `(${esc('08/19/2025')}) Tj`,
    '120 0 Td',
    `(${esc('36,810 mi')}) Tj`,
    '100 0 Td',
    `(${esc('Certified Vehicle Service Center')}) Tj`,
    '160 0 Td',
    `(${esc('Scheduled 35k Service (Verified)')}) Tj`,
    'ET',

    // Legal / Security Box at Bottom
    '0.96 0.97 0.98 rg',
    '0.88 0.9 0.93 RG',
    '0.5 w',
    '40 180 532 80 re',
    'B',

    'BT',
    '/F1 9 Tf',
    '0.1 0.15 0.25 rg',
    '52 242 Td',
    `(${esc('LEGAL & CRYPTOGRAPHIC COMPLIANCE NOTICE')}) Tj`,
    'ET',

    'BT',
    '/F2 7.5 Tf',
    '0.3 0.35 0.4 rg',
    '52 226 Td',
    `(${esc('This official vehicle history record was assembled and verified in accordance with the Federal Anti-Car Theft Act.')}) Tj`,
    '0 -12 Td',
    `(${esc('National Motor Vehicle Title Information System (NMVTIS) clearinghouse records are protected under federal law.')}) Tj`,
    '0 -12 Td',
    `(${esc(`Tamper-Evident SHA-256 Digest: AA-SEAL-${orderNum.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(16).toUpperCase()}`)}) Tj`,
    '0 -12 Td',
    `(${esc(`Sealed for recipient: ${customerName} (${customerEmail}) on ${generatedTimestamp}`)}) Tj`,
    'ET',

    // Document Footer
    'BT',
    '/F2 8 Tf',
    '0.55 0.6 0.65 rg',
    '180 90 Td',
    `(${esc('AutoAudit Technologies Inc. - Cryptographic Vehicle Intelligence Engine')}) Tj`,
    'ET'
  ];

  const contentStream = lines.join('\n');
  const streamBuffer = Buffer.from(contentStream, 'utf-8');

  // Standard PDF 1.4 Object Structure
  const objects = [
    // 1: Catalog
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    // 2: Pages
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    // 3: Page (US Letter: 612 x 792 pt)
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`,
    // 4: Contents Stream
    `4 0 obj\n<< /Length ${streamBuffer.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    // 5: Bold Font
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    // 6: Regular Font
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body, 'utf-8'));
    body += objects[i];
  }

  const xrefOffset = Buffer.byteLength(body, 'utf-8');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const off of offsets) {
    body += String(off).padStart(10, '0') + ' 00000 n \n';
  }

  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, 'utf-8');
}

/**
 * Retrieves a cached report PDF buffer for an order, or generates one on-demand.
 */
export function getReportPdfForOrder(orderId: string): { buffer: Buffer; fileName: string } | null {
  const cached = pdfCache.get(orderId);
  if (cached) {
    return { buffer: cached.buffer, fileName: cached.fileName };
  }

  // Look up order in db
  const order = db.getOrderById(orderId);
  if (!order) return null;

  const buffer = generateDummyPdfBuffer(order);
  const sanitizedVin = (order.vehicle.vinOrReg || 'RECORD').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `AutoAudit_Report_${sanitizedVin}_${order.orderNumber}.pdf`;

  pdfCache.set(orderId, {
    buffer,
    fileName,
    generatedAt: new Date().toISOString()
  });

  return { buffer, fileName };
}

/**
 * Core Mock Report Generator Service execution logic.
 * Triggers when an order reaches 'Paid' status (newly created or updated).
 * 1. Generates a dummy report PDF buffer.
 * 2. Caches the PDF buffer.
 * 3. Attaches the resultFile metadata to the order in the database.
 * 4. Advances the order status to 'Ready' (or 'Delivered').
 * 5. Notifies the user via the existing email notification system with the PDF attached.
 */
export async function processOrderReport(
  order: Order,
  options?: {
    autoNotifyUser?: boolean;
    targetStatus?: 'Ready' | 'Delivered';
  }
): Promise<{
  success: boolean;
  order: Order;
  pdfBuffer: Buffer;
  fileName: string;
  fileUrl: string;
  emailMessageId?: string;
}> {
  const now = new Date().toISOString();
  const sanitizedVin = (order.vehicle.vinOrReg || 'RECORD').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `AutoAudit_Report_${sanitizedVin}_${order.orderNumber}.pdf`;
  const fileUrl = `/api/reports/download/${order.id}`;

  console.log(`[MockReportGenerator] Auto-generating dummy report PDF for Order #${order.orderNumber} (VIN: ${order.vehicle.vinOrReg})...`);

  // 1. Generate real PDF binary buffer
  const pdfBuffer = generateDummyPdfBuffer(order);

  // 2. Cache PDF buffer for zero-latency download
  pdfCache.set(order.id, {
    buffer: pdfBuffer,
    fileName,
    generatedAt: now
  });
  pdfCache.set(order.orderNumber, {
    buffer: pdfBuffer,
    fileName,
    generatedAt: now
  });

  // 3. Attach resultFile metadata onto the order
  const fileMetadata: { fileName: string; fileUrl: string; type: 'pdf' } = {
    fileName,
    fileUrl,
    type: 'pdf'
  };

  const updatedOrder = db.attachOrderReport(
    order.id,
    fileMetadata,
    'AutoAudit Mock Report Generator Service'
  ) || order;

  // 4. Advance status to 'Ready' (or requested targetStatus)
  const targetStatus = options?.targetStatus || 'Ready';
  db.updateOrderStatus(
    order.id,
    targetStatus,
    `Official dummy report PDF generated (${fileName}) by AutoAudit automated intelligence engine.`
  );

  updatedOrder.status = targetStatus;
  updatedOrder.resultFile = {
    ...fileMetadata,
    uploadedAt: now,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  let emailMessageId: string | undefined;

  // 5. Notify the customer via existing email notification system
  if (options?.autoNotifyUser !== false) {
    try {
      const emailResult = await sendMockEmail({
        order: updatedOrder,
        type: 'report_ready',
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      emailMessageId = emailResult.messageId;
      console.log(`[MockReportGenerator] Customer ${order.customer.email} notified via report_ready email (MsgID: ${emailMessageId})`);
    } catch (err) {
      console.error('[MockReportGenerator] Error notifying customer via email:', err);
    }
  }

  return {
    success: true,
    order: updatedOrder,
    pdfBuffer,
    fileName,
    fileUrl,
    emailMessageId
  };
}

/**
 * Trigger hook for new order creation:
 * If the incoming order has 'Paid' status, immediately initiates report generation.
 */
export function handleNewOrderCreation(newOrder: Order): void {
  const isPaid = newOrder.payment?.status === 'Paid' || newOrder.status === 'Paid / New' || newOrder.status === 'Processing';

  if (!isPaid) {
    console.log(`[MockReportGenerator] Order #${newOrder.orderNumber} is not marked Paid. Skipping auto-report generation.`);
    return;
  }

  // Trigger generation with brief 1.5s simulated compilation delay
  setTimeout(async () => {
    try {
      await processOrderReport(newOrder, { autoNotifyUser: true, targetStatus: 'Ready' });
    } catch (err) {
      console.error(`[MockReportGenerator] Error generating report for new order #${newOrder.orderNumber}:`, err);
    }
  }, 1500);
}

/**
 * Service status summary for monitoring & admin inspect
 */
export function getReportGeneratorStatus() {
  return {
    service: 'AutoAudit Mock Report Generator Service',
    status: 'ACTIVE',
    mode: 'Automatic Trigger on Paid Orders',
    cachedReportsCount: pdfCache.size,
    supportedFormats: ['application/pdf'],
    features: [
      'Automatic PDF 1.4 generation on Paid status',
      'Attachment support in Nodemailer mock SMTP dispatch',
      'Direct browser stream endpoint at /api/reports/download/:id',
      'Tamper-evident verification seal and NMVTIS findings'
    ]
  };
}
