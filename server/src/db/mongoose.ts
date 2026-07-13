import mongoose from 'mongoose';
import { logger } from '../utils/logger';

function buildSafeUri(raw: string): string {
  try {
    // Multi-host Atlas URIs can't be parsed by standard URL parser — that's OK
    if (raw.includes(',')) {
      // Extract username from multi-host URI for logging only
      const match = raw.match(/mongodb:\/\/([^:]+):/);
      const user = match ? match[1].substring(0, 3) + '***' : 'unknown';
      logger.info(`MongoDB URI detected (multi-host Atlas) — user: ${user}`);
    } else {
      const url = new URL(raw);
      const maskedUser = url.username ? url.username.substring(0, 3) + '***' : 'unknown';
      logger.info(`MongoDB URI parsed — host: ${url.hostname}, user: ${maskedUser}, db: ${url.pathname}`);
    }
  } catch {
    // Non-fatal — just log and continue
  }
  return raw;
}

export const connectDB = async (): Promise<void> => {
  const raw = process.env.MONGODB_URI;

  if (!raw) {
    logger.error('MONGODB_URI is not set. Add it in Render → Environment Variables.');
    return;
  }

  const uri = buildSafeUri(raw);

  const connect = async (): Promise<void> => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS:          60000,
        connectTimeoutMS:         30000,
        maxPoolSize:              10,
        retryWrites:              true,
      });
      logger.info(`MongoDB connected successfully — host: ${mongoose.connection.host}`);
    } catch (err: unknown) {
      const msg = String(err).substring(0, 300);
      logger.error(`MongoDB connection failed: ${msg}`);

      if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
        logger.error('AUTH FAILURE — Check: 1) Atlas password is correct, 2) Username matches Atlas Database User, 3) Network Access allows 0.0.0.0/0');
      }
      if (msg.includes('ENOTFOUND') || msg.includes('querySrv')) {
        logger.error('DNS FAILURE — Check MONGODB_URI cluster hostname is correct');
      }
      if (msg.includes('timed out') || msg.includes('ETIMEDOUT')) {
        logger.error('NETWORK TIMEOUT — In MongoDB Atlas: Network Access → Add 0.0.0.0/0');
      }

      logger.info('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connect, 5000);
    }
  };

  await connect();
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${String(err).substring(0, 200)}`));
