import { Redis } from 'ioredis';
import { logger } from '../../utils/logger.js';

/**
 * Redis service for caching client configs, biomarkers, and templates
 * Reduces MongoDB load and improves response times from 500ms → <10ms
 */
export class RedisService {
    private client: Redis | null = null;
    private isConnected = false;

    constructor(private readonly redisUrl?: string) { }

    /**
     * Initialize Redis connection
     * Falls back gracefully if Redis is unavailable (cache disabled)
     */
    async connect(): Promise<void> {
        try {
            if (!this.redisUrl) {
                logger.warn('REDIS_URL not configured - caching disabled');
                return;
            }

            this.client = new Redis(this.redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) {
                        logger.error('Redis connection failed after 3 retries');
                        return null; // Stop retrying
                    }
                    return Math.min(times * 100, 3000); // Exponential backoff
                },
            });

            this.client.on('connect', () => {
                logger.info('Redis connected successfully');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                logger.error({ err }, 'Redis connection error');
                this.isConnected = false;
            });

            await this.client.ping();
        } catch (error) {
            logger.error({ error }, 'Failed to initialize Redis - cache disabled');
            this.client = null;
        }
    }

    /**
     * Get cached value by key
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client || !this.isConnected) return null;

        try {
            const value = await this.client.get(key);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            logger.error({ error, key }, 'Redis GET error');
            return null;
        }
    }

    /**
     * Set cached value with TTL (in seconds)
     */
    async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            const serialized = JSON.stringify(value);
            await this.client.setex(key, ttlSeconds, serialized);
        } catch (error) {
            logger.error({ error, key }, 'Redis SET error');
        }
    }

    /**
     * Delete cached value by key
     */
    async del(key: string): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            await this.client.del(key);
        } catch (error) {
            logger.error({ error, key }, 'Redis DEL error');
        }
    }

    /**
     * Delete all keys matching a pattern (use with caution!)
     */
    async delPattern(pattern: string): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            logger.error({ error, pattern }, 'Redis DEL pattern error');
        }
    }

    /**
     * Increment a counter (used for rate limiting)
     */
    async incr(key: string): Promise<number> {
        if (!this.client || !this.isConnected) return 0;

        try {
            return await this.client.incr(key);
        } catch (error) {
            logger.error({ error, key }, 'Redis INCR error');
            return 0;
        }
    }

    /**
     * Set expiry on a key
     */
    async expire(key: string, seconds: number): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            await this.client.expire(key, seconds);
        } catch (error) {
            logger.error({ error, key }, 'Redis EXPIRE error');
        }
    }

    /**
     * Close Redis connection gracefully
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis disconnected');
        }
    }
}

// Singleton instance
export const redisService = new RedisService(process.env.REDIS_URL);
