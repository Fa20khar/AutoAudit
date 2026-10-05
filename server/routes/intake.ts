import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAdminAuth } from '../middleware/auth';
import { CustomerIntakeSubmission, Order, AuditLog } from '../../src/types';
import { processOrderReport } from '../services/mockReportGenerator';

export const intakeRouter = Router();

// Helper to sanitize text
function sanitizeText(str: any): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/intake
 * List customer intake submissions (Admin staff view or email-filtered customer view)
 */
intakeRouter.get('/', (req: Request, res: Response) => {
  const { email, status } = req.query;

  if (!email) {
    return requireAdminAuth(req, res, () => {
      let list = db.getIntakeSubmissions();
      if (status && typeof status === 'string' && status !== 'All') {
        list = list.filter(item => item.status.toLowerCase() === status.toLowerCase());
      }
      res.json({
        success: true,
        count: list.length,
        data: list
      });
    });
  }

  // Customer self-service filtered by email
  const cleanEmail = String(email).trim().toLowerCase();
  const list = db.getIntakeSubmissions().filter(item => item.email.toLowerCase() === cleanEmail);
  res.json({
    success: true,
    count: list.length,
    data: list
  });
});

/**
 * POST /api/intake
 * Submits Customer Data Form according to Google Forms specification
 * Optionally auto-generates official dummy report PDF immediately
 */
intakeRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body;

  // Validation: Customer Info
  const fullName = sanitizeText(body.fullName);
  const email = sanitizeText(body.email).toLowerCase();
  const phone = sanitizeText(body.phone);
  const country = sanitizeText(body.country);
  const preferredContactMethod = body.preferredContactMethod || 'Email';

  if (!fullName || fullName.length < 2) {
    res.status(400).json({ success: false, error: 'Full Name is required (minimum 2 characters).' });
    return;
  }
  if (!EMAIL_REGEX.test(email)) {
    res.status(422).json({ success: false, error: 'A valid email address is required.' });
    return;
  }
  if (!phone) {
    res.status(400).json({ success: false, error: 'Phone / WhatsApp number is required.' });
    return;
  }
  if (!country) {
    res.status(400).json({ success: false, error: 'Customer country is required.' });
    return;
  }

  // Validation: Vehicle Info
  const vinOrChassis = sanitizeText(body.vinOrChassis || body.vin).toUpperCase();
  const registrationPlate = sanitizeText(body.registrationPlate || body.regPlate || body.plate).toUpperCase();
  const make = sanitizeText(body.make);
  const model = sanitizeText(body.model);
  const modelYear = Number(body.modelYear) || new Date().getFullYear();
  const vehicleColor = sanitizeText(body.vehicleColor) || 'Unknown';
  const currentMileage = sanitizeText(body.currentMileage) || 'Pending verification';
  const countryOfRegistration = sanitizeText(body.countryOfRegistration) || country;

  if (!vinOrChassis) {
    res.status(400).json({ success: false, error: 'VIN / Chassis number is required.' });
    return;
  }
  if (!registrationPlate) {
    res.status(400).json({ success: false, error: 'Registration number / license plate is required.' });
    return;
  }
  if (!make || !model) {
    res.status(400).json({ success: false, error: 'Vehicle Make and Model are required.' });
    return;
  }

  // Validation: Report Request
  const reportType = sanitizeText(body.reportType) || 'Complete Vehicle History Report';
  const reasonForRequest = sanitizeText(body.reasonForRequest) || 'Considering purchasing a vehicle';
  const purchaseStatus = sanitizeText(body.purchaseStatus) || 'Planning to purchase';

  // Validation: Consent Checkboxes
  const accuracyConfirmed = Boolean(body.accuracyConfirmed);
  const dataUsageConsent = Boolean(body.dataUsageConsent);
  const termsAgreed = Boolean(body.termsAgreed);

  if (!accuracyConfirmed || !dataUsageConsent || !termsAgreed) {
    res.status(422).json({
      success: false,
      error: 'All three customer consent checkboxes (Accuracy, Data Usage, and Terms & Privacy) must be accepted.'
    });
    return;
  }

  const now = new Date().toISOString();
  const submissionNumber = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
  const submissionId = `intake-${Date.now()}`;

  const submission: CustomerIntakeSubmission = {
    id: submissionId,
    submissionNumber,
    timestamp: now,
    fullName,
    email,
    phone,
    country,
    preferredContactMethod,
    vinOrChassis,
    registrationPlate,
    make,
    model,
    modelYear,
    vehicleColor,
    currentMileage,
    countryOfRegistration,
    reportType,
    reasonForRequest,
    purchaseStatus,
    additionalNotes: sanitizeText(body.additionalNotes || body.additionalInformation),
    documentFileName: body.documentFileName ? sanitizeText(body.documentFileName) : undefined,
    documentFileSize: body.documentFileSize ? sanitizeText(body.documentFileSize) : undefined,
    accuracyConfirmed,
    dataUsageConsent,
    termsAgreed,
    status: 'Received'
  };

  db.createIntakeSubmission(submission);

  let generatedOrder: Order | undefined;
  let reportDownloadUrl: string | undefined;

  // Auto-generate report workflow
  const shouldAutoGenerate = body.autoGenerateReport !== false;

  if (shouldAutoGenerate) {
    try {
      const orderNum = `AA-${Math.floor(10000 + Math.random() * 90000)}`;
      const orderId = `ord-${Date.now()}`;

      const auditLogs: AuditLog[] = [
        {
          id: `log-${Date.now()}-1`,
          timestamp: now,
          actor: 'Customer Intake Form',
          action: 'Intake Request Submitted',
          details: `Submitted via Google Forms spec intake layer (${submissionNumber}).`
        },
        {
          id: `log-${Date.now()}-2`,
          timestamp: now,
          actor: 'AutoAudit Automated Engine',
          action: 'Auto-Generate Triggered',
          details: `Auto-compiling vehicle intelligence report for ${make} ${model} (${vinOrChassis}).`
        }
      ];

      const newOrder: Order = {
        id: orderId,
        orderNumber: orderNum,
        serviceId: 'comprehensive-vin',
        serviceName: reportType,
        status: 'Paid / New',
        subtotal: 28.99,
        discountAmount: 0,
        total: 28.99,
        customer: {
          fullName,
          email,
          phone,
          smsNotifications: true
        },
        vehicle: {
          vinOrReg: vinOrChassis,
          isVin: vinOrChassis.length === 17,
          make,
          model,
          year: modelYear,
          mileage: currentMileage,
          countryOrState: countryOfRegistration,
          customerNotes: `Plate: ${registrationPlate}. Reason: ${reasonForRequest}. Note: ${submission.additionalNotes || 'None'}`
        },
        payment: {
          status: 'Paid',
          gatewayRef: `intake_req_${submissionNumber}`,
          paidAt: now,
          method: 'AutoAudit Intake Instant Voucher'
        },
        internalNotes: `AutoAudit Customer Intake Submission #${submissionNumber}. Preferred Contact: ${preferredContactMethod}`,
        createdAt: now,
        updatedAt: now,
        auditLogs
      };

      db.createOrder(newOrder);

      // Trigger Mock Report Generator Service
      const reportResult = await processOrderReport(newOrder, {
        autoNotifyUser: true,
        targetStatus: 'Ready'
      });

      generatedOrder = reportResult.order;
      reportDownloadUrl = reportResult.fileUrl;

      // Update intake record with generated status & links
      db.updateIntakeSubmission(submissionId, {
        status: 'Report Generated',
        autoGeneratedOrderId: orderId,
        autoGeneratedReportUrl: reportDownloadUrl,
        internalNotes: `Report auto-generated (${reportResult.fileName}). Notified via email & queued for ${preferredContactMethod}.`
      });

      submission.status = 'Report Generated';
      submission.autoGeneratedOrderId = orderId;
      submission.autoGeneratedReportUrl = reportDownloadUrl;
    } catch (err: any) {
      console.error('[IntakeRouter] Auto-generation error:', err);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Vehicle history report request successfully submitted to AutoAudit.',
    data: {
      submission,
      order: generatedOrder,
      reportDownloadUrl,
      confirmation: {
        title: 'Thank you for choosing AutoAudit!',
        message: 'Your vehicle history report request has been successfully submitted. Our team will review the information provided and contact you using your preferred contact method.',
        tagline: 'AutoAudit — Know the History. Drive with Confidence.'
      }
    }
  });
});

/**
 * PATCH /api/intake/:id
 * Update status or internal notes (Staff only)
 */
intakeRouter.patch('/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, internalNotes } = req.body;

  const updated = db.updateIntakeSubmission(id, {
    ...(status ? { status } : {}),
    ...(internalNotes ? { internalNotes: sanitizeText(internalNotes) } : {})
  });

  if (!updated) {
    res.status(404).json({ success: false, error: `Intake submission "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    data: updated
  });
});

/**
 * POST /api/intake/:id/auto-generate
 * Manually trigger auto-report compilation for an existing submission
 */
intakeRouter.post('/:id/auto-generate', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const submission = db.getIntakeSubmissionById(id);

  if (!submission) {
    res.status(404).json({ success: false, error: `Intake submission "${id}" not found.` });
    return;
  }

  const now = new Date().toISOString();
  const orderNum = `AA-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderId = `ord-${Date.now()}`;

  const newOrder: Order = {
    id: orderId,
    orderNumber: orderNum,
    serviceId: 'comprehensive-vin',
    serviceName: submission.reportType,
    status: 'Paid / New',
    subtotal: 28.99,
    discountAmount: 0,
    total: 28.99,
    customer: {
      fullName: submission.fullName,
      email: submission.email,
      phone: submission.phone,
      smsNotifications: true
    },
    vehicle: {
      vinOrReg: submission.vinOrChassis,
      isVin: submission.vinOrChassis.length === 17,
      make: submission.make,
      model: submission.model,
      year: submission.modelYear,
      mileage: submission.currentMileage || 'Pending verification',
      countryOrState: submission.countryOfRegistration,
      customerNotes: `Plate: ${submission.registrationPlate}. Reason: ${submission.reasonForRequest}`
    },
    payment: {
      status: 'Paid',
      gatewayRef: `intake_req_${submission.submissionNumber}`,
      paidAt: now,
      method: 'Admin Manual Auto-Generate'
    },
    internalNotes: `Auto-generated from intake request #${submission.submissionNumber}. Contact: ${submission.preferredContactMethod}`,
    createdAt: now,
    updatedAt: now,
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        actor: 'Admin Staff',
        action: 'Manual Report Compilation',
        details: `Triggered auto-generate report for intake ${submission.submissionNumber}.`
      }
    ]
  };

  db.createOrder(newOrder);

  const result = await processOrderReport(newOrder, {
    autoNotifyUser: true,
    targetStatus: 'Ready'
  });

  db.updateIntakeSubmission(submission.id, {
    status: 'Report Generated',
    autoGeneratedOrderId: orderId,
    autoGeneratedReportUrl: result.fileUrl,
    internalNotes: `Report auto-generated by admin (${result.fileName}). Customer notified.`
  });

  res.json({
    success: true,
    message: `Report auto-generated successfully for intake submission ${submission.submissionNumber}.`,
    data: {
      order: result.order,
      reportUrl: result.fileUrl,
      fileName: result.fileName
    }
  });
});
