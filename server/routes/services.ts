import { Router, Request, Response } from 'express';
import { db } from '../db';

export const servicesRouter = Router();

// GET /api/services
servicesRouter.get('/', async (_req: Request, res: Response) => {
  const services = await db.getServicesAsync();
  res.json({
    success: true,
    data: services
  });
});

// GET /api/services/:id
servicesRouter.get('/:id', async (req: Request, res: Response) => {
  const service = await db.getServiceByIdAsync(req.params.id);
  if (!service) {
    res.status(404).json({ success: false, error: 'Service tier not found.' });
    return;
  }
  res.json({ success: true, data: service });
});
