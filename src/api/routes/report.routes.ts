import type { FastifyInstance } from 'fastify';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import * as reportController from '../../modules/report/report.controller.js';

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // List reports (authenticated)
  fastify.get('/reports', {
    preHandler: [authenticatePreHandler],
    handler: reportController.listReports,
  });

  // Get single report metadata
  fastify.get('/reports/:reportId', {
    preHandler: [authenticatePreHandler],
    handler: reportController.getReport,
  });

  // Download report PDF
  fastify.get('/reports/:reportId/pdf', {
    preHandler: [authenticatePreHandler],
    handler: reportController.downloadReportPdf,
  });

  // Delete a report
  fastify.delete('/reports/:reportId', {
    preHandler: [authenticatePreHandler],
    handler: reportController.deleteReport,
  });
}
