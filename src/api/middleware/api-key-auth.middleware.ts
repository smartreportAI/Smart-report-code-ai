import type { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../utils/logger.js';
import { Client } from '../../models/client.model.js';
import { redisService } from '../../services/cache/redis.service.js';

/**
 * API Key authentication middleware for LIS (machine-to-machine) requests
 * Validates API key from X-API-Key header and loads client config
 */
export async function apiKeyAuthMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
        await reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Missing X-API-Key header',
        });
        return;
    }

    try {
        // Try to get client from cache first
        const cacheKey = `apikey:${apiKey}`;
        let clientConfig = await redisService.get<{
            clientId: string;
            status: string;
            subscription: { plan: string };
        }>(cacheKey);

        // If not in cache, fetch from database
        if (!clientConfig) {
            const client = await Client.findOne({
                'apiCredentials.apiKeys.key': apiKey,
                'apiCredentials.apiKeys.isActive': true,
            }).lean();

            if (!client) {
                logger.warn({ apiKey: apiKey.substring(0, 10) + '...' }, 'Invalid API key');
                await reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Invalid or inactive API key',
                });
                return;
            }

            // Check if client is active
            if (client.status !== 'active') {
                logger.warn({ clientId: client.clientId, status: client.status }, 'Inactive client');
                await reply.status(403).send({
                    statusCode: 403,
                    error: 'Forbidden',
                    message: 'Client account is not active',
                });
                return;
            }

            clientConfig = {
                clientId: client.clientId,
                status: client.status,
                subscription: {
                    plan: client.subscription?.plan || 'free',
                },
            };

            // Cache for 5 minutes
            await redisService.set(cacheKey, clientConfig, 300);
        }

        // Attach client info to request
        request.clientId = clientConfig.clientId;
        request.clientConfig = clientConfig;

        logger.info({ clientId: clientConfig.clientId }, 'API key authenticated');
    } catch (error) {
        logger.error({ error }, 'API key authentication error');
        await reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Authentication failed',
        });
    }
}

/**
 * Flexible auth middleware that accepts either JWT or API Key
 * Try JWT first, fallback to API Key
 */
export async function flexibleAuthMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    const hasJwt = request.headers.authorization?.startsWith('Bearer ');
    const hasApiKey = !!request.headers['x-api-key'];

    if (hasJwt) {
        // Try JWT authentication
        try {
            await request.jwtVerify();
            return; // JWT auth successful
        } catch {
            // JWT failed, try API key if available
            if (!hasApiKey) {
                await reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Invalid or missing token',
                });
                return;
            }
        }
    }

    if (hasApiKey) {
        // Try API key authentication
        await apiKeyAuthMiddleware(request, reply);
        return;
    }

    // No auth provided
    await reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing authentication - provide either Bearer token or X-API-Key',
    });
}

// Extend FastifyRequest to include client info
declare module 'fastify' {
    interface FastifyRequest {
        clientId?: string;
        clientConfig?: {
            clientId: string;
            status: string;
            subscription: { plan: string };
        };
    }
}
