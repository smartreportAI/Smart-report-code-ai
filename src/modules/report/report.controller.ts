import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import mongoose from 'mongoose';
import * as reportService from './report.service.js';
import type { JwtPayload } from '../../types/index.js';

const reportInputSchema = z.object({
  patientName: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  tests: z.array(z.unknown()).optional(),
  labNo: z.string().optional(),
  workOrderId: z.string().optional(),
  org: z.string().optional(),
  Centre: z.string().optional(),
  results: z.array(z.unknown()).optional(),
  data: z.array(z.unknown()).optional(),
  clientId: z.string().optional(),
  language: z.string().optional(),
}).transform((data) => ({
  patientName: data.patientName ?? '',
  age: data.age ?? 0,
  gender: data.gender ?? '',
  tests: data.tests ?? [],
  labNo: data.labNo,
  workOrderId: data.workOrderId,
  org: data.org,
  Centre: data.Centre,
  results: data.results,
  data: data.data,
  clientId: data.clientId,
  language: data.language,
}));

export async function createPortalReport(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
): Promise<void> {
  const body = reportInputSchema.parse(request.body);
  const user = request.user as JwtPayload;
  const userId = user?.sub ? new mongoose.Types.ObjectId(user.sub) : null;
  const { clientId, language, ...input } = body;
  const result = await reportService.createReport(input, userId, clientId);
  await reply.send(result);
}

export async function createLisReport(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
): Promise<void> {
  const body = reportInputSchema.parse(request.body);
  const { clientId, language, ...input } = body;
  const result = await reportService.createReport(input, null, clientId);
  await reply.send(result);
}

export async function listReports(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; status?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { page, limit, status } = request.query;
  const user = request.user as JwtPayload | undefined;
  const userId = user?.sub ? new mongoose.Types.ObjectId(user.sub) : undefined;
  const result = await reportService.listReports({
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
    status,
    userId,
  });
  await reply.send(result);
}

export async function getReport(
  request: FastifyRequest<{ Params: { reportId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const report = await reportService.getReport(request.params.reportId);
  if (!report) {
    await reply.status(404).send({ error: 'Report not found' });
    return;
  }
  await reply.send(report);
}

export async function downloadReportPdf(
  request: FastifyRequest<{ Params: { reportId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const buffer = await reportService.getReportPdfBuffer(request.params.reportId);
  if (!buffer) {
    await reply.status(404).send({ error: 'Report PDF not found' });
    return;
  }
  await reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${request.params.reportId}.pdf"`)
    .send(buffer);
}

export async function deleteReport(
  request: FastifyRequest<{ Params: { reportId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const deleted = await reportService.deleteReport(request.params.reportId);
  if (!deleted) {
    await reply.status(404).send({ error: 'Report not found' });
    return;
  }
  await reply.send({ success: true, message: 'Report deleted' });
}
