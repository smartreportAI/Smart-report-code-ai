import axios, { AxiosError } from 'axios';
import { logger } from '../../utils/logger.js';

/**
 * Webhook delivery service for dispatching reports to client callback URLs
 * Includes retry logic and proper error handling
 */
export class WebhookService {
    /**
     * Dispatch report to client webhook URL
     */
    async dispatch(
        url: string,
        payload: Record<string, unknown>,
        headers: Record<string, string> = {},
        retryPolicy = { maxRetries: 3, backoffMs: 1000 },
    ): Promise<{ success: boolean; error?: string }> {
        let attempt = 0;

        while (attempt <= retryPolicy.maxRetries) {
            try {
                const response = await axios.post(url, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'SmartReport/1.0',
                        ...headers,
                    },
                    timeout: 30000, // 30 second timeout
                });

                logger.info(
                    {
                        url,
                        status: response.status,
                        attempt: attempt + 1,
                        labNo: payload.labNo,
                    },
                    'Webhook delivered successfully',
                );

                return { success: true };
            } catch (error) {
                const axiosError = error as AxiosError;
                const statusCode = axiosError.response?.status;

                logger.warn(
                    {
                        url,
                        attempt: attempt + 1,
                        maxRetries: retryPolicy.maxRetries,
                        statusCode,
                        error: axiosError.message,
                        labNo: payload.labNo,
                    },
                    'Webhook delivery attempt failed',
                );

                // Don't retry on 4xx client errors (except 429 rate limit)
                if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
                    logger.error(
                        { url, statusCode, error: axiosError.message },
                        'Webhook delivery failed with client error - no retry',
                    );
                    return {
                        success: false,
                        error: `Client error: ${statusCode} - ${axiosError.message}`,
                    };
                }

                // If we've exhausted retries, fail
                if (attempt === retryPolicy.maxRetries) {
                    logger.error(
                        { url, attempts: attempt + 1, error: axiosError.message },
                        'Webhook delivery failed after max retries',
                    );
                    return {
                        success: false,
                        error: `Failed after ${attempt + 1} attempts: ${axiosError.message}`,
                    };
                }

                // Wait before retrying (exponential backoff)
                const delay = retryPolicy.backoffMs * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
                attempt++;
            }
        }

        return { success: false, error: 'Unexpected error' };
    }

    /**
     * Validate webhook URL before sending
     */
    isValidUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const webhookService = new WebhookService();
