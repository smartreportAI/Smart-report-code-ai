import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { ReportConfig, DEFAULT_COLORS } from '../../models/reportConfig.model.js';
import { loadConfig } from '../../core/config/loadConfig.js';

const colorSchemaZ = z.object({
  normal: z.string().optional(),
  borderline: z.string().optional(),
  high: z.string().optional(),
  low: z.string().optional(),
  critical: z.string().optional(),
}).optional();

const configUpdateSchema = z.object({
  stateData: z.record(z.unknown()).optional(),
  colorObj: z.object({
    colored: colorSchemaZ,
    greyscaled: colorSchemaZ,
  }).optional(),
  patientDetailsData: z.record(z.unknown()).optional(),
  coverPage: z.record(z.unknown()).optional(),
  headerFooter: z.record(z.unknown()).optional(),
  fonts: z.record(z.unknown()).optional(),
  doctorSignatures: z.array(z.unknown()).optional(),
});

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  // Get system defaults
  fastify.get('/configs/defaults', {
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const defaults = await loadConfig();
      await reply.send({
        colors: DEFAULT_COLORS,
        stateData: defaults.stateData,
      });
    },
  });

  // Get config for a client
  fastify.get('/configs/:clientId', {
    preHandler: [authenticatePreHandler],
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const config = await ReportConfig.findOne({ clientId: request.params.clientId }).lean();
      if (!config) {
        await reply.status(404).send({ error: 'Config not found for this client' });
        return;
      }
      await reply.send(config);
    },
  });

  // Update/create config for a client
  fastify.put('/configs/:clientId', {
    preHandler: [authenticatePreHandler],
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
      if (body.headerFooter) updateDoc.headerFooter = body.headerFooter;
      if (body.fonts) updateDoc.fonts = body.fonts;
      if (body.doctorSignatures) updateDoc.doctorSignatures = body.doctorSignatures;

      const config = await ReportConfig.findOneAndUpdate(
        { clientId },
        { $set: updateDoc, $setOnInsert: { clientId, createdAt: new Date() } },
        { upsert: true, new: true, lean: true },
      );

      await reply.send(config);
    },
  });

  // Preview: get resolved config (merged defaults + client overrides)
  fastify.post('/configs/:clientId/preview', {
    preHandler: [authenticatePreHandler],
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const resolved = await loadConfig(request.params.clientId);
      await reply.send(resolved);
    },
  });
}
