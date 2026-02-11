import type { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Smart Report AI API',
        description: 'AI Smart Lab Report platform backend',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development',
        },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
