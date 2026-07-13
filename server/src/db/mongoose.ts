import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI environment variable is not set. Please add it in Render → Environment.');
    // Don't exit — let server start so health check passes
    return;
  }

  const connect = async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
      });
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    } catch (err: unknown) {
      logger.error('MongoDB connection failed', { err: String(err).substring(0, 200) });
      logger.info('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connect, 5000);
    }
  };

  await connect();
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error', { err: String(err).substring(0, 200) });
});
