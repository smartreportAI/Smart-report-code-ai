import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { env } from './config/env.js';
import { errorHandlerPlugin } from './plugins/error-handler.plugin.js';
import { authPlugin } from './plugins/auth.plugin.js';
import { swaggerPlugin } from './plugins/swagger.plugin.js';
import { healthRoutes } from './api/routes/health.routes.js';
import { authRoutes } from './api/routes/auth.routes.js';
import { portalRoutes } from './api/routes/portal.routes.js';
import { lisRoutes } from './api/routes/lis.routes.js';
import { reportRoutes } from './api/routes/report.routes.js';
import { reportRoutes as reportV2Routes } from './api/routes/reports-v2.routes.js';
import { configRoutes } from './api/routes/config.routes.js';
import { clientRoutes } from './api/routes/client.routes.js';
import { mappingRoutes } from './api/routes/mapping.routes.js';
import { biomarkerRoutes } from './api/routes/biomarker.routes.js';

export async function buildApp() {
  const isDev = env.NODE_ENV === 'development';

  const fastify = Fastify({
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    logger: {
      level: 'info',
      transport:
        isDev
          ? {
              target: 'pino-pretty',
              options: { colorize: true },
            }
          : undefined,
    },
  });

  await fastify.register(cors, { origin: true });

  const reportsPath = path.join(process.cwd(), 'reports');
  await fastify.register(fastifyStatic, {
    root: reportsPath,
    prefix: '/reports/',
  });

  await fastify.register(swaggerPlugin);
  await fastify.register(errorHandlerPlugin);

  // Register auth and API routes in same scope so routes inherit the authenticate decorator
  await fastify.register(async (apiScope) => {
    await apiScope.register(authPlugin);
    await apiScope.register(healthRoutes, { prefix: '/api/v1' });
    await apiScope.register(authRoutes, { prefix: '/api/v1' });
    await apiScope.register(portalRoutes, { prefix: '/api/v1' });
    await apiScope.register(lisRoutes, { prefix: '/api/v1' });
    await apiScope.register(reportRoutes, { prefix: '/api/v1' });
    await apiScope.register(reportV2Routes, { prefix: '/api/v1/reports/v2' });
    await apiScope.register(configRoutes, { prefix: '/api/v1' });
    await apiScope.register(clientRoutes, { prefix: '/api/v1' });
    await apiScope.register(mappingRoutes, { prefix: '/api/v1' });
    await apiScope.register(biomarkerRoutes, { prefix: '/api/v1' });
  });

  return fastify;
}
