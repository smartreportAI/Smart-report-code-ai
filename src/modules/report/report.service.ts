import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Report } from './report.model.js';
import type { IReport } from './report.model.js';
import { ReportPipeline } from '../../core/pipeline/ReportPipeline.js';
import { loadConfig } from '../../core/config/loadConfig.js';
import type { Types } from 'mongoose';

export interface CreateReportResult {
  reportId: string;
  pdfUrl: string;
  testCount: number;
  profileCount: number;
  insightCount: number;
}

export async function createReport(
  input: Record<string, unknown>,
  userId: Types.ObjectId | null,
  clientId?: string,
): Promise<CreateReportResult> {
  const resolvedClientId =
    clientId ?? (input.clientId as string) ?? (input.ClientId as string) ?? undefined;
  const config = await loadConfig(resolvedClientId);

  const startTime = Date.now();
  const pipeline = new ReportPipeline();
  const ctx = await pipeline.generate(input, { config });
  const totalDurationMs = Date.now() - startTime;

  const pdfUrl = '/reports/sample.pdf';
  const abnormalCount = ctx.mappedTests.filter(
    (t) => t.colorIndicator !== 'normal'
  ).length;

  await Report.create({
    reportId: ctx.reportId,
    userId,
    clientId: resolvedClientId ?? null,
    patientName: ctx.input.patientName ?? '',
    labNo: ctx.input.labNo ?? null,
    workOrderId: ctx.input.workOrderId ?? null,
    testCount: ctx.mappedTests.length,
    profileCount: ctx.profiles.length,
    insightCount: ctx.insights.length,
    status: 'completed',
    pdfUrl,
    generatedAt: new Date(),
    input: {
      testCount: ctx.mappedTests.length,
      profileCount: ctx.profiles.length,
      abnormalCount,
      jsonUrl: null,
    },
    output: {
      reportType: (ctx.input.reportType ?? ctx.config?.stateData?.reportType ?? 'dynamic') as string,
      language: ctx.language,
      fileSizeBytes: ctx.pdfBuffer?.length ?? null,
    },
    performance: {
      totalDurationMs,
    },
  });

  return {
    reportId: ctx.reportId,
    pdfUrl,
    testCount: ctx.mappedTests.length,
    profileCount: ctx.profiles.length,
    insightCount: ctx.insights.length,
  };
}

export async function listReports(options: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: Types.ObjectId;
}): Promise<{ reports: IReport[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (options.status) filter.status = options.status;
  if (options.userId) filter.userId = options.userId;

  const [reports, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Report.countDocuments(filter),
  ]);

  return { reports, total, page, pages: Math.ceil(total / limit) };
}

export async function getReport(reportId: string): Promise<IReport | null> {
  return Report.findOne({ reportId }).lean();
}

export async function getReportPdfBuffer(reportId: string): Promise<Buffer | null> {
  const report = await Report.findOne({ reportId }).lean();
  if (!report?.pdfUrl) return null;
  const fileName = report.pdfUrl.replace('/reports/', '');
  const filePath = join(process.cwd(), 'reports', fileName);
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  const report = await Report.findOne({ reportId });
  if (!report) return false;
  // Remove PDF file (skip for shared sample.pdf)
  if (report.pdfUrl && report.pdfUrl !== '/reports/sample.pdf') {
    const fileName = report.pdfUrl.replace('/reports/', '');
    const filePath = join(process.cwd(), 'reports', fileName);
    try {
      await unlink(filePath);
    } catch {
      // File may already be deleted
    }
  }
  await Report.deleteOne({ reportId });
  return true;
}
