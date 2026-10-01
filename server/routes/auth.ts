import { Router, Request, Response } from 'express';
import { verifyAdminCredentials, ADMIN_AUTH_TOKEN } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/admin-login
authRouter.post('/admin-login', (req: Request, res: Response) => {
  const { email, password, accessKey } = req.body;

  const isValid = verifyAdminCredentials(email, password, accessKey);

  if (!isValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid administrative credentials. Access restricted to authorized AutoAudit staff.'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Staff authentication successful.',
    token: ADMIN_AUTH_TOKEN,
    user: {
      email: email || 'admin@autoaudit.com',
      role: 'Staff Administrator',
      loginTime: new Date().toISOString()
    }
  });
});

// GET /api/auth/verify
authRouter.get('/verify', (req: Request, res: Response) => {
  const token = 
    req.headers['x-admin-token'] || 
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
      ? req.headers.authorization.slice(7) 
      : null);

  if (token === ADMIN_AUTH_TOKEN || token === process.env.ADMIN_SECRET_KEY) {
    res.json({ success: true, authenticated: true, role: 'Staff Administrator' });
  } else {
    res.status(401).json({ success: false, authenticated: false });
  }
});
