import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export async function connectDb(uri: string): Promise<void> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(uri);
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      attempt++;
      logger.warn({ attempt, maxRetries: MAX_RETRIES, err }, 'MongoDB connection failed, retrying...');
      if (attempt >= MAX_RETRIES) {
        logger.error('MongoDB connection failed after max retries');
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
