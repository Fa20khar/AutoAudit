import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getReportPdfForOrder, processOrderReport, getReportGeneratorStatus, generateDummyPdfBuffer } from '../services/mockReportGenerator';

export const reportsRouter = Router();

/**
 * GET /api/reports/status
 * Health & monitoring for the Mock Report Generator Service
 */
reportsRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getReportGeneratorStatus()
  });
});

/**
 * GET /api/reports/download/:id
 * Streams the auto-generated dummy report PDF binary directly to the browser
 * Works with both orderId (e.g. "ord-1234") and orderNumber (e.g. "AA-10025")
 */
reportsRouter.get('/download/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let order = db.getOrderById(id);

    if (!order) {
      // If order was created client-side or during another session, synthesize a valid order record
      const vinParam = (req.query.vin as string) || (id.includes('1H') ? id : '1HECM82633A004359');
      order = {
        id,
        orderNumber: id.startsWith('AA-') ? id : `AA-${id.replace(/[^0-9]/g, '').slice(-5) || '10025'}`,
        serviceId: 'comprehensive-vin',
        serviceName: 'Comprehensive Vehicle History Report',
        price: 42.99,
        total: 42.99,
        status: 'Ready',
        customer: {
          fullName: (req.query.name as string) || 'Authorized Customer',
          email: (req.query.email as string) || 'customer@autoaudit.com'
        },
        vehicle: {
          vinOrReg: vinParam,
          year: '2021',
          make: 'Honda',
          model: 'Civic',
          mileage: '41,800 mi'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        auditLogs: []
      } as any;
    }

    const report = getReportPdfForOrder(order.id) || {
      buffer: generateDummyPdfBuffer(order),
      fileName: `AutoAudit_Report_${(order.vehicle.vinOrReg || 'RECORD').replace(/[^a-zA-Z0-9]/g, '_')}_${order.orderNumber}.pdf`
    };

    if (!report || !report.buffer) {
      res.status(500).json({
        success: false,
        error: `Failed to compile PDF report for order ${order.orderNumber}.`
      });
      return;
    }

    // Set standard PDF download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.fileName}"`);
    res.setHeader('Content-Length', report.buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(report.buffer);
  } catch (err: any) {
    console.error('[ReportsRouter] Download error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to serve PDF report.'
    });
  }
});

/**
 * POST /api/reports/generate/:id
 * Programmatically triggers or re-triggers mock report generation and email notification
 */
reportsRouter.post('/generate/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    res.status(404).json({
      success: false,
      error: `Order with identifier "${id}" not found.`
    });
    return;
  }

  try {
    const notifyUser = req.body?.notifyUser !== false;
    const result = await processOrderReport(order, { autoNotifyUser: notifyUser });

    res.json({
      success: true,
      message: `Report PDF auto-generated successfully for order ${order.orderNumber}.`,
      data: {
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        orderStatus: result.order.status,
        emailMessageId: result.emailMessageId
      }
    });
  } catch (err: any) {
    console.error('[ReportsRouter] Generation error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate report.'
    });
  }
});
