import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { vinRouter } from './server/routes/vin';
import { ordersRouter } from './server/routes/orders';
import { servicesRouter } from './server/routes/services';
import { couponsRouter } from './server/routes/coupons';
import { emailsRouter } from './server/routes/emails';
import { statsRouter } from './server/routes/stats';
import { authRouter } from './server/routes/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body parser for JSON payloads
  app.use(express.json());

  // API Health Check & Info
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'AutoAudit Vehicle Intelligence Engine',
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // REST API Route Mounts
  app.use('/api/auth', authRouter);
  app.use('/api/vin', vinRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/coupons', couponsRouter);
  app.use('/api/emails', emailsRouter);
  app.use('/api/stats', statsRouter);

  // Catch-all 404 handler for undefined /api routes (Express 5 compatible)
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `API route ${req.method} ${req.originalUrl} not found.`
    });
  });

  // Vite development middleware or production static serving
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AutoAudit server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start AutoAudit server:', err);
  process.exit(1);
});
