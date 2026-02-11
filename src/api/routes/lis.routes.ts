import type { FastifyInstance } from 'fastify';
import * as reportController from '../../modules/report/report.controller.js';

export async function lisRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/lis/report', reportController.createLisReport);
}
