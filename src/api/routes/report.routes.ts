import type { FastifyInstance } from 'fastify';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { requestStartPreHandler } from '../../utils/apiResponse.js';
import * as reportController from '../../modules/report/report.controller.js';

const preHandlers = [requestStartPreHandler, authenticatePreHandler];

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // List reports (authenticated)
  fastify.get('/reports', {
    preHandler: preHandlers,
    handler: reportController.listReports,
  });

  // Get single report metadata
  fastify.get('/reports/:reportId', {
    preHandler: preHandlers,
    handler: reportController.getReport,
  });

  // Download report PDF (binary response)
  fastify.get('/reports/:reportId/pdf', {
    preHandler: preHandlers,
    handler: reportController.downloadReportPdf,
  });

  // Delete a report
  fastify.delete('/reports/:reportId', {
    preHandler: preHandlers,
    handler: reportController.deleteReport,
  });
}
