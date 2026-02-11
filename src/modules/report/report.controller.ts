import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import * as reportService from './report.service.js';
import type { JwtPayload } from '../../types/index.js';

/** Accepts both canonical (nested) and legacy (flat) input formats. Raw body is passed to pipeline; parseInput normalizes it. */
const reportInputSchema = z.object({
  version: z.string().optional(),
  clientId: z.string().optional(),
  order: z
    .object({
      labNo: z.string().optional(),
      workOrderId: z.string().optional(),
      org: z.string().optional(),
      centre: z.string().optional(),
    })
    .optional(),
  patient: z
    .object({
      name: z.string().optional(),
      age: z.number().optional(),
      gender: z.string().optional(),
    })
    .optional(),
  options: z
    .object({
      reportType: z.enum(['compact', 'dynamic']).optional(),
      language: z.string().optional(),
    })
    .optional(),
  tests: z.array(z.unknown()).optional(),
  results: z.array(z.unknown()).optional(),
  data: z.array(z.unknown()).optional(),
  patientName: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  labNo: z.string().optional(),
  workOrderId: z.string().optional(),
  org: z.string().optional(),
  Centre: z.string().optional(),
  reportType: z.enum(['compact', 'dynamic']).optional(),
  language: z.string().optional(),
}).passthrough();

export async function createPortalReport(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
): Promise<void> {
  const body = reportInputSchema.parse(request.body) as Record<string, unknown>;
  const user = request.user as JwtPayload;
  const userId = user?.sub ? new mongoose.Types.ObjectId(user.sub) : null;
  const clientId = (body.clientId as string) ?? undefined;
  const result = await reportService.createReport(body, userId, clientId);
  sendSuccess(reply, result, request);
}

export async function createLisReport(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
): Promise<void> {
  const body = reportInputSchema.parse(request.body) as Record<string, unknown>;
  const clientId = (body.clientId as string) ?? undefined;
  const result = await reportService.createReport(body, null, clientId);
  sendSuccess(reply, result, request);
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
  sendSuccess(reply, result, request);
}

export async function getReport(
  request: FastifyRequest<{ Params: { reportId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const report = await reportService.getReport(request.params.reportId);
  if (!report) {
    sendError(reply, request, 'NOT_FOUND', 'Report not found', 404);
    return;
  }
  sendSuccess(reply, report, request);
}

export async function downloadReportPdf(
  request: FastifyRequest<{ Params: { reportId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const buffer = await reportService.getReportPdfBuffer(request.params.reportId);
  if (!buffer) {
    sendError(reply, request, 'NOT_FOUND', 'Report PDF not found', 404);
    return;
  }
  void reply
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
    sendError(reply, request, 'NOT_FOUND', 'Report not found', 404);
    return;
  }
  sendSuccess(reply, { success: true, message: 'Report deleted' }, request);
}
