import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongoDB, isMongoConnected, disconnectMongoDB } from './connection';
import {
  OrderModel,
  ServiceModel,
  CouponModel,
  EmailModel,
  CustomerIntakeModel,
  WhatsAppConfigModel,
  ReferralModel
} from './index';
import {
  INITIAL_SERVICES,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_EMAILS,
  INITIAL_INTAKE_SUBMISSIONS
} from '../db';
import { INITIAL_WHATSAPP_CONFIG } from '../../src/data/initialData';
import { Order, ServicePlan, Coupon, EmailNotification, CustomerIntakeSubmission } from '../../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  source?: 'backup' | 'memory' | 'auto';
  seedInitialIfEmpty?: boolean;
}

export interface CollectionMigrationStats {
  collection: string;
  sourceCount: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface MigrationReport {
  timestamp: string;
  dryRun: boolean;
  sourceType: string;
  collections: Record<string, CollectionMigrationStats>;
  totalProcessed: number;
  totalErrors: number;
  durationMs: number;
  destinationCounts: Record<string, number>;
  reconciled: boolean;
  message: string;
}

/**
 * Batches an array into chunks of the given size
 */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Executes a safe, idempotent migration of all AutoAudit datasets into MongoDB Atlas
 */
export async function runMigration(options: MigrationOptions = {}): Promise<MigrationReport> {
  const startTime = Date.now();
  const dryRun = Boolean(options.dryRun);
  const batchSize = Math.max(1, options.batchSize || 50);
  const requestedSource = options.source || 'auto';

  console.log(`[Migration] Starting MongoDB Atlas migration utility... (dryRun: ${dryRun})`);

  // Ensure MongoDB connection is active
  if (!isMongoConnected()) {
    const connected = await connectToMongoDB();
    if (!connected && !dryRun) {
      throw new Error('Cannot run migration: MongoDB Atlas connection could not be established.');
    }
  }

  // 1. Determine and fetch source data
  let sourceServices: ServicePlan[] = [...INITIAL_SERVICES];
  let sourceCoupons: Coupon[] = [...INITIAL_COUPONS];
  let sourceOrders: Order[] = [...INITIAL_ORDERS];
  let sourceEmails: EmailNotification[] = [...INITIAL_EMAILS];
  let sourceIntake: CustomerIntakeSubmission[] = [...INITIAL_INTAKE_SUBMISSIONS];

  let sourceType = 'AutoAudit Production Seed & Memory Repository';

  // Check if historical JSON backup exists
  const backupPath = path.resolve(__dirname, 'backup', 'supabase_backup.json');
  if ((requestedSource === 'backup' || requestedSource === 'auto') && fs.existsSync(backupPath)) {
    try {
      const backupRaw = fs.readFileSync(backupPath, 'utf8');
      const backupData = JSON.parse(backupRaw);
      if (Array.isArray(backupData.orders) && backupData.orders.length > 0) {
        sourceOrders = backupData.orders;
      }
      if (Array.isArray(backupData.coupons) && backupData.coupons.length > 0) {
        sourceCoupons = backupData.coupons;
      }
      if (Array.isArray(backupData.emails) && backupData.emails.length > 0) {
        sourceEmails = backupData.emails;
      }
      sourceType = `Verified Historical Archive (${path.basename(backupPath)} - ${backupData.exportedAt || 'Archived'})`;
      console.log(`[Migration] Loaded ${sourceOrders.length} orders, ${sourceCoupons.length} coupons, and ${sourceEmails.length} emails from historical backup archive.`);
    } catch (e: any) {
      console.warn('[Migration] Note: Could not parse backup file, using active memory repository:', e?.message);
    }
  }

  const stats: Record<string, CollectionMigrationStats> = {
    services: {
      collection: 'services',
      sourceCount: sourceServices.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    coupons: {
      collection: 'coupons',
      sourceCount: sourceCoupons.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    orders: {
      collection: 'orders',
      sourceCount: sourceOrders.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    emails: {
      collection: 'emails',
      sourceCount: sourceEmails.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    intakeSubmissions: {
      collection: 'customerIntake',
      sourceCount: sourceIntake.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    whatsAppConfig: {
      collection: 'whatsAppConfig',
      sourceCount: 1,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }
  };

  // 2. Process Services in batches
  for (const batch of chunkArray(sourceServices, batchSize)) {
    for (const service of batch) {
      stats.services.processed++;
      if (dryRun) {
        stats.services.inserted++;
        continue;
      }
      try {
        const existing = await ServiceModel.findOne({ id: service.id });
        if (existing) {
          await ServiceModel.updateOne({ id: service.id }, { $set: service });
          stats.services.updated++;
        } else {
          await ServiceModel.create(service);
          stats.services.inserted++;
        }
      } catch (err: any) {
        stats.services.failed++;
        stats.services.errors.push(`Service ${service.id}: ${err.message}`);
      }
    }
  }

  // 3. Process Coupons in batches
  for (const batch of chunkArray(sourceCoupons, batchSize)) {
    for (const coupon of batch) {
      stats.coupons.processed++;
      if (dryRun) {
        stats.coupons.inserted++;
        continue;
      }
      try {
        const code = coupon.code.toUpperCase();
        const existing = await CouponModel.findOne({ code });
        if (existing) {
          await CouponModel.updateOne({ code }, { $set: coupon });
          stats.coupons.updated++;
        } else {
          await CouponModel.create({ ...coupon, code });
          stats.coupons.inserted++;
        }
      } catch (err: any) {
        stats.coupons.failed++;
        stats.coupons.errors.push(`Coupon ${coupon.code}: ${err.message}`);
      }
    }
  }

  // 4. Process Orders in batches
  for (const batch of chunkArray(sourceOrders, batchSize)) {
    for (const order of batch) {
      stats.orders.processed++;
      if (dryRun) {
        stats.orders.inserted++;
        continue;
      }
      try {
        const existing = await OrderModel.findOne({
          $or: [{ id: order.id }, { orderNumber: order.orderNumber }]
        });
        if (existing) {
          await OrderModel.updateOne(
            { id: order.id },
            {
              $set: {
                ...order,
                updatedAt: order.updatedAt || new Date().toISOString()
              }
            }
          );
          stats.orders.updated++;
        } else {
          await OrderModel.create(order);
          stats.orders.inserted++;
        }
      } catch (err: any) {
        stats.orders.failed++;
        stats.orders.errors.push(`Order ${order.orderNumber}: ${err.message}`);
      }
    }
  }

  // 5. Process Emails in batches
  for (const batch of chunkArray(sourceEmails, batchSize)) {
    for (const email of batch) {
      stats.emails.processed++;
      if (dryRun) {
        stats.emails.inserted++;
        continue;
      }
      try {
        const existing = await EmailModel.findOne({ id: email.id });
        if (existing) {
          await EmailModel.updateOne({ id: email.id }, { $set: email });
          stats.emails.updated++;
        } else {
          await EmailModel.create(email);
          stats.emails.inserted++;
        }
      } catch (err: any) {
        stats.emails.failed++;
        stats.emails.errors.push(`Email ${email.id}: ${err.message}`);
      }
    }
  }

  // 6. Process Intake Submissions in batches
  for (const batch of chunkArray(sourceIntake, batchSize)) {
    for (const intake of batch) {
      stats.intakeSubmissions.processed++;
      if (dryRun) {
        stats.intakeSubmissions.inserted++;
        continue;
      }
      try {
        const existing = await CustomerIntakeModel.findOne({
          $or: [{ id: intake.id }, { submissionNumber: intake.submissionNumber }]
        });
        if (existing) {
          await CustomerIntakeModel.updateOne({ id: intake.id }, { $set: intake });
          stats.intakeSubmissions.updated++;
        } else {
          await CustomerIntakeModel.create(intake);
          stats.intakeSubmissions.inserted++;
        }
      } catch (err: any) {
        stats.intakeSubmissions.failed++;
        stats.intakeSubmissions.errors.push(`Intake ${intake.submissionNumber}: ${err.message}`);
      }
    }
  }

  // 7. Process WhatsApp Config
  stats.whatsAppConfig.processed++;
  if (dryRun) {
    stats.whatsAppConfig.inserted++;
  } else {
    try {
      await WhatsAppConfigModel.updateOne(
        { key: 'global' },
        { $setOnInsert: { key: 'global', ...INITIAL_WHATSAPP_CONFIG } },
        { upsert: true }
      );
      stats.whatsAppConfig.inserted++;
    } catch (err: any) {
      stats.whatsAppConfig.failed++;
      stats.whatsAppConfig.errors.push(`WhatsApp Config: ${err.message}`);
    }
  }

  // Destination reconciliation counts
  const destinationCounts: Record<string, number> = {};
  if (!dryRun && isMongoConnected()) {
    try {
      destinationCounts.services = await ServiceModel.countDocuments();
      destinationCounts.coupons = await CouponModel.countDocuments();
      destinationCounts.orders = await OrderModel.countDocuments();
      destinationCounts.emails = await EmailModel.countDocuments();
      destinationCounts.intakeSubmissions = await CustomerIntakeModel.countDocuments();
      destinationCounts.whatsAppConfig = await WhatsAppConfigModel.countDocuments();
    } catch {
      // ignore
    }
  }

  const durationMs = Date.now() - startTime;
  let totalProcessed = 0;
  let totalErrors = 0;

  for (const key of Object.keys(stats)) {
    totalProcessed += stats[key].processed;
    totalErrors += stats[key].failed;
  }

  const reconciled =
    dryRun ||
    (destinationCounts.orders >= sourceOrders.length &&
      destinationCounts.services >= sourceServices.length &&
      destinationCounts.coupons >= sourceCoupons.length);

  return {
    timestamp: new Date().toISOString(),
    dryRun,
    sourceType,
    collections: stats,
    totalProcessed,
    totalErrors,
    durationMs,
    destinationCounts,
    reconciled,
    message: dryRun
      ? `Dry run completed successfully. ${totalProcessed} records analyzed from ${sourceType} with 0 write modifications.`
      : `Migration completed in ${durationMs}ms. ${totalProcessed} records processed (${totalErrors} errors). Reconciled: ${reconciled}`
  };
}

// Standalone CLI runner when executed via `tsx server/mongodb/migration.ts`
if (process.argv[1] && process.argv[1].endsWith('migration.ts')) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('------------------------------------------------------------');
  console.log('   AutoAudit - MongoDB Atlas Migration Utility');
  console.log('------------------------------------------------------------');

  runMigration({ dryRun })
    .then((report) => {
      console.log('\nMigration Summary Report:');
      console.log(JSON.stringify(report, null, 2));
      return disconnectMongoDB();
    })
    .then(() => {
      console.log('\nMigration finished cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nFatal migration error:', err);
      process.exit(1);
    });
}
