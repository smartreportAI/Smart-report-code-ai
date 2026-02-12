// @ts-nocheck
// ============================================================================
// 🚀 QUICK INTEGRATION GUIDE - Connect All the New Features
// ============================================================================
// ⚠️ THIS IS A TEMPLATE FILE - NOT MEANT TO RUN DIRECTLY
// 
// INSTRUCTIONS:
// 1. Copy the code below (lines 16-97) into your src/index.ts file
// 2. Adjust imports if needed based on your project structure
// 3. The @ts-nocheck above is only for THIS template file - don't copy it!
//
// The "Cannot find module" errors in this file are EXPECTED and NORMAL
// because these paths are relative to src/, not the root directory.
// Once you copy this to src/index.ts, all imports will work correctly.
// ============================================================================

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { redisService } from './services/cache/redis.service.js';
import { s3Service } from './services/storage/s3.service.js';

async function startServer() {
    try {
        logger.info('🚀 Starting Smart Report AI Server...');

        // 1. Connect to MongoDB
        logger.info('📦 Connecting to MongoDB...');
        await connectDB();
        logger.info('✅ MongoDB connected');

        // 2. Connect to Redis (optional - gracefully disabled if not configured)
        logger.info('🔴 Connecting to Redis cache...');
        await redisService.connect();
        if (redisService['isConnected']) {
            logger.info('✅ Redis connected - caching enabled');
        } else {
            logger.warn('⚠️  Redis not configured - caching disabled (app will be slower)');
        }

        // 3. Initialize S3 service (optional - gracefully disabled if not configured)
        logger.info('☁️  Initializing AWS S3...');
        s3Service.initialize();
        if (s3Service['isEnabled']) {
            logger.info('✅ S3 initialized - PDF upload enabled');
        } else {
            logger.warn('⚠️  AWS not configured - PDF upload to S3 disabled');
        }

        // 4. Build Fastify app with all routes and middleware
        logger.info('🔧 Building Fastify application...');
        const app = await buildApp();

        // 5. Start listening
        const port = env.PORT;
        await app.listen({ port, host: '0.0.0.0' });

        logger.info(
            {
                port,
                env: env.NODE_ENV,
                redis: redisService['isConnected'] ? 'enabled' : 'disabled',
                s3: s3Service['isEnabled'] ? 'enabled' : 'disabled',
            },
            `✅ Server started successfully!`,
        );

        logger.info(`📝 API Documentation: http://localhost:${port}/documentation`);
        logger.info(`🏥 Health Check: http://localhost:${port}/api/v1/health`);

        // 6. Graceful shutdown handlers
        const shutdown = async (signal: string) => {
            logger.info({ signal }, '⏹️  Shutdown signal received, closing server gracefully...');

            try {
                // Close Fastify server (stops accepting new requests)
                await app.close();
                logger.info('✅ Fastify server closed');

                // Disconnect from Redis
                await redisService.disconnect();
                logger.info('✅ Redis disconnected');

                // Close MongoDB connection
                // await mongoose.connection.close(); // If you use mongoose directly

                logger.info('✅ Graceful shutdown complete');
                process.exit(0);
            } catch (error) {
                logger.error({ error }, '❌ Error during shutdown');
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        logger.error({ error }, '❌ Failed to start server');
        process.exit(1);
    }
}

// Start the server
startServer();
