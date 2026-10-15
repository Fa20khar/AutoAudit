import mongoose from 'mongoose';

/**
 * MongoDB Atlas Connection Configuration & State
 */
export interface MongoStatus {
  isConfigured: boolean;
  isConnected: boolean;
  state: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unconfigured' | 'error';
  host: string;
  databaseName: string;
  lastConnectedAt: string | null;
  lastError: string | null;
  pingMs: number | null;
}

// Internal connection tracking state
let lastConnectedAt: string | null = null;
let lastError: string | null = null;
let isConnecting = false;

/**
 * Safely masks a MongoDB connection string to prevent leaking passwords in logs
 * e.g. mongodb+srv://user:secret@cluster0.abc.mongodb.net/db -> mongodb+srv://user:***@cluster0.abc.mongodb.net/db
 */
export function maskMongoUri(uri: string): string {
  if (!uri) return '';
  return uri.replace(/\/\/(.*):(.*)@/, '//$1:***@');
}

/**
 * Retrieves the MongoDB URI from backend environment variables only
 * NEVER exposed to Vite / React frontend
 */
export function getMongoUri(): string {
  return process.env.MONGODB_URI || '';
}

/**
 * Checks if a MongoDB URI is present and formatted
 */
export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return Boolean(uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')));
}

/**
 * Checks if Mongoose is actively connected to MongoDB
 */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Formats the current Mongoose connection state into a human-readable string
 */
export function getMongoStateString(): MongoStatus['state'] {
  if (!isMongoConfigured()) return 'unconfigured';
  switch (mongoose.connection.readyState) {
    case 0:
      return lastError ? 'error' : 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}

/**
 * Retrieves sanitized connection status for health checks and admin probes
 */
export async function getMongoStatus(): Promise<MongoStatus> {
  const isConfigured = isMongoConfigured();
  const isConnected = isMongoConnected();
  let pingMs: number | null = null;

  if (isConnected && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    } catch {
      pingMs = null;
    }
  }

  const host = mongoose.connection.host || (isConfigured ? 'atlas-cluster' : 'not configured');
  const databaseName = mongoose.connection.name || (isConfigured ? 'autoaudit_db' : 'in-memory-fallback');

  return {
    isConfigured,
    isConnected,
    state: getMongoStateString(),
    host,
    databaseName,
    lastConnectedAt,
    lastError,
    pingMs
  };
}

/**
 * Establishes a production-ready connection to MongoDB Atlas
 * Configured with conservative timeouts and automatic reconnection
 */
export async function connectToMongoDB(customUri?: string): Promise<boolean> {
  const uri = customUri || getMongoUri();

  if (!uri) {
    console.info(
      '[MongoDB Atlas Notice] MONGODB_URI is not set in environment. AutoAudit is operating in resilient local mode with in-memory persistence and local storage. Configure MONGODB_URI in your environment to persist to MongoDB Atlas.'
    );
    return false;
  }

  if (isMongoConnected()) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  isConnecting = true;
  const masked = maskMongoUri(uri);

  try {
    console.log(`[MongoDB Atlas] Initiating connection to: ${masked}`);

    // Register event listeners once
    mongoose.connection.removeAllListeners('connected');
    mongoose.connection.removeAllListeners('error');
    mongoose.connection.removeAllListeners('disconnected');
    mongoose.connection.removeAllListeners('reconnected');

    mongoose.connection.on('connected', () => {
      lastConnectedAt = new Date().toISOString();
      lastError = null;
      console.log(`[MongoDB Atlas] Successfully connected to database: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      lastError = err?.message || 'Unknown MongoDB connection error';
      console.error('[MongoDB Atlas] Runtime connection error:', lastError);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Atlas] Connection disconnected. MongoDB driver will attempt auto-reconnect.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB Atlas] Connection re-established.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if cluster is unreachable
      connectTimeoutMS: 10000,        // Initial connection timeout (10s)
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
      maxPoolSize: 10,                // Maintain up to 10 socket connections
      minPoolSize: 1,                 // Keep at least 1 socket active
      heartbeatFrequencyMS: 10000,    // Health check cluster every 10s
      retryWrites: true,
      w: 'majority'
    });

    lastConnectedAt = new Date().toISOString();
    lastError = null;
    isConnecting = false;
    return true;
  } catch (err: any) {
    lastError = err?.message || 'Failed to connect to MongoDB Atlas';
    isConnecting = false;
    console.error(`[MongoDB Atlas] Connection failed for ${masked}:`, lastError);
    return false;
  }
}

/**
 * Gracefully terminates MongoDB connection upon server shutdown
 */
export async function disconnectMongoDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    console.log('[MongoDB Atlas] Closing database connection gracefully...');
    try {
      await mongoose.disconnect();
      console.log('[MongoDB Atlas] Database connection closed.');
    } catch (err: any) {
      console.error('[MongoDB Atlas] Error during disconnect:', err?.message);
    }
  }
}
