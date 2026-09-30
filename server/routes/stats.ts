import { Router, Request, Response } from 'express';
import { db } from '../db';

export const statsRouter = Router();

// GET /api/stats
statsRouter.get('/', (_req: Request, res: Response) => {
  const orders = db.getOrders();
  const totalRevenue = orders.reduce((acc, o) => acc + (o.payment.status === 'Paid' ? o.total : 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
  const pendingCount = orders.filter(o => o.status === 'Paid / New' || o.status === 'Processing' || o.status === 'NMVTIS Check').length;

  res.json({
    success: true,
    data: {
      totalOrders: orders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      deliveredCount,
      pendingCount,
      fulfillmentRate: orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 100,
      activeCoupons: db.getCoupons().filter(c => c.active).length,
      emailsDispatched: db.getEmails().length
    }
  });
});
