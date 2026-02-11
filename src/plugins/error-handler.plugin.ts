import type { FastifyInstance, FastifyError, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

const isMongoDuplicateKey = (err: unknown): boolean =>
  err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000;

function statusToCode(statusCode: number): string {
  const map: Record<number, string> = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHORIZED',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR',
  };
  return map[statusCode] ?? 'INTERNAL_ERROR';
}

function sendErrorResponse(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
): void {
  const body = {
    status: 'error' as const,
    error: { code, message, ...(details != null ? { details } : {}) },
    meta: { requestId, timestamp: new Date().toISOString() },
  };
  void reply.status(statusCode).send(body);
}

export async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.id ?? 'unknown';

    if (isMongoDuplicateKey(error)) {
      sendErrorResponse(reply, 409, 'CONFLICT', 'Email already registered', requestId);
      return;
    }

    if (error instanceof ZodError) {
      const details = error.flatten().fieldErrors;
      sendErrorResponse(reply, 400, 'VALIDATION_ERROR', 'Validation failed', requestId, details);
      return;
    }

    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      sendErrorResponse(reply, 401, 'UNAUTHORIZED', 'Invalid or missing token', requestId);
      return;
    }

    fastify.log.error({ err: error, requestId }, error.message);

    const statusCode = error.statusCode ?? 500;
    const code = statusToCode(statusCode);
    const message = error.message ?? 'An unexpected error occurred';
    sendErrorResponse(reply, statusCode, code, message, requestId);
  });
}
