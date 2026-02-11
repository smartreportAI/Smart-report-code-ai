import type { FastifyInstance } from 'fastify';
import { requestStartPreHandler } from '../../utils/apiResponse.js';
import * as reportController from '../../modules/report/report.controller.js';

export async function lisRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/lis/report', {
    preHandler: [requestStartPreHandler],
    handler: reportController.createLisReport,
  });
}
