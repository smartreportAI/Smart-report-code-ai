import type { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';

const isMongoDuplicateKey = (err: unknown): boolean =>
  err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000;

export async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.id ?? 'unknown';

    if (isMongoDuplicateKey(error)) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email already registered',
        requestId,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        requestId,
        details: error.flatten().fieldErrors,
      });
    }

    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or missing token',
        requestId,
      });
    }

    fastify.log.error({ err: error, requestId }, error.message);

    return reply.status(error.statusCode ?? 500).send({
      statusCode: error.statusCode ?? 500,
      error: error.code ?? 'Internal Server Error',
      message: error.message ?? 'An unexpected error occurred',
      requestId,
    });
  });
}
