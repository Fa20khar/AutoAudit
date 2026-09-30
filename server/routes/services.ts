import { Router, Request, Response } from 'express';
import { db } from '../db';

export const servicesRouter = Router();

// GET /api/services
servicesRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.getServices()
  });
});

// GET /api/services/:id
servicesRouter.get('/:id', (req: Request, res: Response) => {
  const service = db.getServiceById(req.params.id);
  if (!service) {
    res.status(404).json({ success: false, error: 'Service tier not found.' });
    return;
  }
  res.json({ success: true, data: service });
});
