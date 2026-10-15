import 'dotenv/config';
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
import { analyticsRouter } from './server/routes/analytics';
import { reportsRouter } from './server/routes/reports';
import { intakeRouter } from './server/routes/intake';
import { geminiRouter } from './server/routes/gemini';
import { videoRouter, handleGenerateVideo, handleVideoStatus, handleVideoDownload } from './server/routes/video';
import { adminRouter } from './server/routes/admin';
import { adminMongodbRouter } from './server/routes/adminMongodb';
import { connectToMongoDB, disconnectMongoDB, getMongoStatus } from './server/mongodb/connection';
import { ensureDefaultAdminAccount } from './server/middleware/auth';
import { db } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body parser for JSON payloads
  app.use(express.json());

  // CORS Middleware for cloud probes and cross-origin clients
  app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Connect to MongoDB Atlas (primary application database)
  try {
    const mongoConnected = await connectToMongoDB();
    if (mongoConnected) {
      await db.hydrateFromMongoDB();
      await ensureDefaultAdminAccount();
    }
  } catch (err: any) {
    console.warn('[MongoDB Atlas] Initialization notice:', err?.message || 'Will use local fallback mode');
  }

  // Health Check endpoints: /health for cloud/Railway deployment probes & /api/health for frontend
  const healthCheckHandler = async (_req: Request, res: Response) => {
    const mongoStatus = await getMongoStatus();
    res.json({
      status: 'ok',
      service: 'AutoAudit Vehicle Intelligence Engine',
      version: '1.3.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        primary: 'MongoDB Atlas',
        status: mongoStatus.state,
        connected: mongoStatus.isConnected,
        pingMs: mongoStatus.pingMs,
        host: mongoStatus.host,
        dbName: mongoStatus.databaseName
      }
    });
  };
  app.get('/health', healthCheckHandler);
  app.get('/api/health', healthCheckHandler);

  // REST API Route Mounts
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter); // Strictly protects all /api/admin/* routes via requireAdminAuth
  app.use('/api/vin', vinRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/coupons', couponsRouter);
  app.use('/api/emails', emailsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/intake', intakeRouter);
  app.use('/api/gemini', geminiRouter);
  app.use('/api/video', videoRouter);

  // Standard Veo 3 Video Generation Endpoints (SKILL.md pattern)
  app.post('/api/generate-video', handleGenerateVideo);
  app.post('/api/video-status', handleVideoStatus);
  app.get('/api/video-download', handleVideoDownload);
  app.post('/api/video-download', handleVideoDownload);

  // Catch-all 404 handler for undefined /api routes
  // Express 5 / path-to-regexp v8 compliance: uses literal prefix mount '/api' without '*' wildcards
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
    // SPA fallback handler: uses path-less middleware instead of invalid '*' wildcard
    // In Express 5 (path-to-regexp v8), app.get('*') throws PathError: Missing parameter name
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global error handler to catch and safely log any uncaught route exceptions
  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('Unhandled server exception:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred.'
    });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AutoAudit server active on http://0.0.0.0:${PORT}`);
  });

  // Graceful server shutdown on process signals
  const handleShutdown = async (signal: string) => {
    console.log(`\n[AutoAudit] Received ${signal}. Commencing graceful shutdown...`);
    server.close(async () => {
      console.log('[AutoAudit] HTTP listener terminated.');
      await disconnectMongoDB();
      console.log('[AutoAudit] Server shutdown complete.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[AutoAudit] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('Failed to start AutoAudit server:', err);
  process.exit(1);
});
