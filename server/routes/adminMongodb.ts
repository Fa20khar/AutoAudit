import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { requireAdminAuth } from '../middleware/auth';
import {
  getMongoStatus,
  isMongoConnected,
  isMongoConfigured,
  maskMongoUri,
  connectToMongoDB
} from '../mongodb/connection';
import {
  OrderModel,
  ServiceModel,
  CouponModel,
  EmailModel,
  CustomerIntakeModel,
  ContactEventModel,
  WhatsAppConfigModel,
  ReferralModel
} from '../mongodb';
import { runMigration } from '../mongodb/migration';

export const adminMongodbRouter = Router();

// Apply admin authentication to all MongoDB admin endpoints
adminMongodbRouter.use(requireAdminAuth);

/**
 * GET /api/admin/mongodb/status
 * Returns deep health metrics, database latency, and collection statistics
 */
adminMongodbRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await getMongoStatus();
    const counts: Record<string, number> = {};

    if (status.isConnected) {
      try {
        counts.orders = await OrderModel.countDocuments();
        counts.services = await ServiceModel.countDocuments();
        counts.coupons = await CouponModel.countDocuments();
        counts.emails = await EmailModel.countDocuments();
        counts.customerIntake = await CustomerIntakeModel.countDocuments();
        counts.contactEvents = await ContactEventModel.countDocuments();
        counts.referrals = await ReferralModel.countDocuments();
      } catch (err: any) {
        console.warn('[Admin Mongo Status] Error reading collection counts:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        ...status,
        collections: counts,
        instructions: !status.isConfigured
          ? 'MONGODB_URI is not set. Add MONGODB_URI=mongodb+srv://<user>:<password>@<host>/autoaudit_db to your environment variables.'
          : !status.isConnected
          ? 'MongoDB Atlas is configured but currently disconnected. Check network access IP whitelist (allow 0.0.0.0/0) and credentials in MongoDB Atlas.'
          : 'MongoDB Atlas is connected and fully operational.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch MongoDB status' });
  }
});

/**
 * POST /api/admin/mongodb/migrate
 * Executes safe, idempotent data migration with dry-run support
 */
adminMongodbRouter.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { dryRun = true, batchSize = 50, source = 'auto' } = req.body;

    const report = await runMigration({
      dryRun: Boolean(dryRun),
      batchSize: Number(batchSize) || 50,
      source
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('[Admin Mongo Migrate] Migration error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Migration encountered an unexpected error.'
    });
  }
});

/**
 * POST /api/admin/mongodb/test-connection
 * Safely tests a MongoDB connection string without leaking credentials in logs
 */
adminMongodbRouter.post('/test-connection', async (req: Request, res: Response) => {
  const { uri } = req.body;
  const targetUri = uri || process.env.MONGODB_URI;

  if (!targetUri) {
    res.status(400).json({
      success: false,
      error: 'No connection URI provided, and MONGODB_URI is not set in environment.'
    });
    return;
  }

  const masked = maskMongoUri(targetUri);

  try {
    // Create temporary isolated connection to test
    const testConn = await mongoose.createConnection(targetUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000
    }).asPromise();

    const start = Date.now();
    await testConn.db?.admin().ping();
    const pingMs = Date.now() - start;

    const dbName = testConn.name;
    const host = testConn.host;

    await testConn.close();

    res.json({
      success: true,
      message: `Successfully connected to MongoDB Atlas (${masked})`,
      details: {
        host,
        databaseName: dbName,
        pingMs
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: `Failed to connect to ${masked}: ${err?.message || 'Connection timeout or invalid credentials'}`
    });
  }
});
