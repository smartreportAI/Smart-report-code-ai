import type { FastifyInstance } from 'fastify';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import * as reportController from '../../modules/report/report.controller.js';

export async function portalRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/portal/report', {
    preHandler: [authenticatePreHandler],
    handler: reportController.createPortalReport,
  });
}
