import type { FastifyRequest, FastifyReply } from 'fastify';
import { redisService } from '../../services/cache/redis.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Rate limit configuration per subscription plan
 */
const RATE_LIMITS: Record<string, { max: number; window: number }> = {
    free: { max: 10, window: 60 }, // 10 req/min
    starter: { max: 60, window: 60 }, // 60 req/min
    pro: { max: 300, window: 60 }, // 300 req/min
    enterprise: { max: 1000, window: 60 }, // 1000 req/min
};

/**
 * Custom rate limiting middleware using Redis
 * Provides per-client rate limits based on subscription plan
 */
export async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    try {
        // Extract client identifier from JWT or API key
        const clientId =
            (request.user as { clientId?: string })?.clientId ||
            (request.headers['x-client-id'] as string) ||
            'anonymous';

        // Get client's subscription plan (default to 'free')
        // In production, this should be fetched from database/cache
        const plan = 'free'; // TODO: Fetch from clientConfig

        const limit = RATE_LIMITS[plan] || RATE_LIMITS.free;
        const key = `ratelimit:${clientId}:${Math.floor(Date.now() / 1000 / limit.window)}`;

        // Increment counter
        const count = await redisService.incr(key);

        // Set expiry on first request
        if (count === 1) {
            await redisService.expire(key, limit.window);
        }

        // Add rate limit headers
        const remaining = Math.max(0, limit.max - count);
        const resetTime = Math.ceil(Date.now() / 1000 / limit.window) * limit.window;

        reply.header('X-RateLimit-Limit', limit.max.toString());
        reply.header('X-RateLimit-Remaining', remaining.toString());
        reply.header('X-RateLimit-Reset', resetTime.toString());

        // Check if rate limit exceeded
        if (count > limit.max) {
            logger.warn({ clientId, plan, count, limit: limit.max }, 'Rate limit exceeded');

            await reply.status(429).send({
                statusCode: 429,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Maximum ${limit.max} requests per ${limit.window} seconds allowed.`,
                retryAfter: resetTime - Math.floor(Date.now() / 1000),
            });

            return;
        }
    } catch (error) {
        // If rate limiting fails (e.g., Redis is down), allow the request
        logger.error({ error }, 'Rate limit check failed - allowing request');
    }
}
