import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAdminAuth } from '../middleware/auth';

export const analyticsRouter = Router();

// POST /api/analytics/contact-events (Public - logs click-to-chat and contact inquiries)
analyticsRouter.post('/contact-events', (req: Request, res: Response) => {
  try {
    const { channel, source, intent, vin, orderNumber, messagePreview, pageUrl, deviceType } = req.body;
    
    if (!source) {
      res.status(400).json({ success: false, error: 'Source is required' });
      return;
    }

    const event = db.logContactEvent({
      channel: channel || 'whatsapp',
      source,
      intent: intent || 'general_support',
      vin,
      orderNumber,
      messagePreview,
      pageUrl,
      deviceType,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to log contact event' });
  }
});

// GET /api/analytics/contact-events (Admin - list all logged events)
analyticsRouter.get('/contact-events', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const events = db.getContactEvents();
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch contact events' });
  }
});

// GET /api/analytics/contact-summary (Admin - aggregate analytics dashboard)
analyticsRouter.get('/contact-summary', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const summary = db.getContactSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate contact summary' });
  }
});

// GET /api/analytics/whatsapp-config (Public - returns active WhatsApp support settings)
analyticsRouter.get('/whatsapp-config', (_req: Request, res: Response) => {
  try {
    const config = db.getWhatsAppConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch WhatsApp config' });
  }
});

// PUT /api/analytics/whatsapp-config (Admin - updates WhatsApp business settings)
analyticsRouter.put('/whatsapp-config', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const updated = db.updateWhatsAppConfig(updates);
    res.json({ success: true, data: updated, message: 'WhatsApp configuration updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update WhatsApp config' });
  }
});
