import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import type { JwtPayload } from '../types/index.js';

/** Standalone preHandler for JWT auth; use this in routes so it works across Fastify encapsulation. */
export async function authenticatePreHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
    request.user = request.user as JwtPayload;
  } catch {
    await reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  }
}

export async function authPlugin(fastify: FastifyInstance): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 10) {
    throw new Error('JWT_SECRET must be set and at least 10 characters');
  }

  await fastify.register(fastifyJwt, {
    secret,
    sign: { expiresIn: '7d' },
  });

  fastify.decorate('authenticate', authenticatePreHandler);
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
