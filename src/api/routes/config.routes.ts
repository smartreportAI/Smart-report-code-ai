import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { requestStartPreHandler, sendSuccess, sendError } from '../../utils/apiResponse.js';
import { ReportConfig, DEFAULT_COLORS } from '../../models/reportConfig.model.js';
import { loadConfig } from '../../core/config/loadConfig.js';

const preHandlers = [requestStartPreHandler, authenticatePreHandler];

const colorSchemaZ = z.object({
  normal: z.string().optional(),
  borderline: z.string().optional(),
  high: z.string().optional(),
  low: z.string().optional(),
  critical: z.string().optional(),
}).optional();

/** stateData flags that control report layout and features. Per Doc 03. */
const stateDataSchema = z.object({
  reportType: z.enum(['compact', 'dynamic']).optional(),
  generateCoverPage: z.boolean().optional(),
  showBodySummary: z.boolean().optional(),
  showSummary: z.boolean().optional(),
  showRiskScore: z.boolean().optional(),
  showHistorical: z.boolean().optional(),
  showRecommendations: z.boolean().optional(),
  showAccreditation: z.boolean().optional(),
  generatePrintPdf: z.boolean().optional(),
  generateVizApp: z.boolean().optional(),
  enableMappingConfig: z.boolean().optional(),
  enableProfileOrder: z.boolean().optional(),
  enableParameterOrder: z.boolean().optional(),
  curLang: z.string().optional(),
  fallbackLang: z.string().optional(),
  summaryType: z.number().optional(),
});

const configUpdateSchema = z.object({
  stateData: z.union([stateDataSchema, z.record(z.unknown())]).optional(),
  colorObj: z.object({
    colored: colorSchemaZ,
    greyscaled: colorSchemaZ,
    reportColors: z.record(z.unknown()).optional(),
  }).optional(),
  patientDetailsData: z.record(z.unknown()).optional(),
  coverPage: z.record(z.unknown()).optional(),
  backPage: z.record(z.unknown()).optional(),
  headerFooter: z.record(z.unknown()).optional(),
  fonts: z.record(z.unknown()).optional(),
  doctorSignatures: z.array(z.unknown()).optional(),
});

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  // Get system defaults
  fastify.get('/configs/defaults', {
    preHandler: [requestStartPreHandler],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const defaults = await loadConfig();
      sendSuccess(reply, { colors: DEFAULT_COLORS, stateData: defaults.stateData }, request);
    },
  });

  // Get config for a client
  fastify.get('/configs/:clientId', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const config = await ReportConfig.findOne({ clientId: request.params.clientId }).lean();
      if (!config) {
        sendError(reply, request, 'NOT_FOUND', 'Config not found for this client', 404);
        return;
      }
      sendSuccess(reply, config, request);
    },
  });

  // Update/create config for a client
  fastify.put('/configs/:clientId', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string }; Body: unknown }>,
      reply: FastifyReply,
    ) => {
      const body = configUpdateSchema.parse(request.body);
      const { clientId } = request.params;

      const updateDoc: Record<string, unknown> = { updatedAt: new Date() };
      if (body.stateData) updateDoc.stateData = body.stateData;
      if (body.colorObj) updateDoc.colorObj = body.colorObj;
      if (body.patientDetailsData) updateDoc.patientDetailsData = body.patientDetailsData;
      if (body.coverPage) updateDoc.coverPage = body.coverPage;
      if (body.backPage) updateDoc.backPage = body.backPage;
      if (body.headerFooter) updateDoc.headerFooter = body.headerFooter;
      if (body.fonts) updateDoc.fonts = body.fonts;
      if (body.doctorSignatures) updateDoc.doctorSignatures = body.doctorSignatures;

      const config = await ReportConfig.findOneAndUpdate(
        { clientId },
        { $set: updateDoc, $setOnInsert: { clientId, createdAt: new Date() } },
        { upsert: true, new: true, lean: true },
      );

      sendSuccess(reply, config, request);
    },
  });

  // Preview: get resolved config (merged defaults + client overrides)
  fastify.post('/configs/:clientId/preview', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const resolved = await loadConfig(request.params.clientId);
      sendSuccess(reply, resolved, request);
    },
  });
}
