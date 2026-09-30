import { Router, Request, Response } from 'express';
import { db } from '../db';

export const emailsRouter = Router();

// GET /api/emails
emailsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: db.getEmails().length,
    data: db.getEmails()
  });
});
