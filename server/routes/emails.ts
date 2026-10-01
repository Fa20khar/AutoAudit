import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAdminAuth } from '../middleware/auth';

export const emailsRouter = Router();

// GET /api/emails (requires staff authorization)
emailsRouter.get('/', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: db.getEmails().length,
    data: db.getEmails()
  });
});
