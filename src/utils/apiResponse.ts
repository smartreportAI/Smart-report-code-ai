import type { FastifyRequest, FastifyReply } from 'fastify';

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  duration?: number;
}

/**
 * PreHandler to capture request start time for duration in meta.
 * Add before other preHandlers when using sendSuccess.
 */
export function requestStartPreHandler(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: () => void,
): void {
  (request as FastifyRequest & { requestStart?: number }).requestStart = Date.now();
  done();
}

/**
 * Send Doc 03-style success response: { status, data, meta }.
 */
export function sendSuccess(
  reply: FastifyReply,
  data: unknown,
  request: FastifyRequest,
): void {
  const start = (request as FastifyRequest & { requestStart?: number }).requestStart ?? Date.now();
  const duration = Date.now() - start;
  void reply.send({
    status: 'success',
    data,
    meta: {
      requestId: request.id ?? 'unknown',
      timestamp: new Date().toISOString(),
      duration,
    },
  });
}

/**
 * Send Doc 03-style error response: { status, error, meta }.
 */
export function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  code: string,
  message: string,
  statusCode = 404,
  details?: unknown,
): void {
  void reply.status(statusCode).send({
    status: 'error',
    error: { code, message, ...(details != null ? { details } : {}) },
    meta: {
      requestId: request.id ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
}
