import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { requestStartPreHandler, sendSuccess, sendError } from '../../utils/apiResponse.js';
import { Client } from '../../models/client.model.js';
import { Report } from '../../modules/report/report.model.js';

const preHandlers = [requestStartPreHandler, authenticatePreHandler];

const createClientSchema = z.object({
  clientId: z.string().min(1),
  displayName: z.string().min(1),
  status: z.enum(['active', 'suspended', 'trial']).optional(),
  subscription: z.object({
    plan: z.string().optional(),
    maxReportsPerMonth: z.number().optional(),
    features: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
  }).optional(),
  contacts: z.object({
    primary: z.object({ name: z.string().optional(), email: z.string().optional(), phone: z.string().optional() }).optional(),
    technical: z.object({ name: z.string().optional(), email: z.string().optional() }).optional(),
  }).optional(),
  lis: z.object({
    name: z.string().optional(),
    inputFormat: z.enum(['standard', 'srl', 'element_based', 'wrapped']).optional(),
    fieldMappings: z.record(z.string()).optional(),
  }).optional(),
  dispatch: z.object({
    type: z.enum(['return', 'webhook', 'whatsapp', 'email']).optional(),
    webhookUrl: z.string().url().optional(),
    webhookHeaders: z.record(z.string()).optional(),
  }).optional(),
});

const updateClientSchema = createClientSchema.omit({ clientId: true }).partial();

export async function clientRoutes(fastify: FastifyInstance): Promise<void> {
  // List all clients
  fastify.get('/clients', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Querystring: { page?: string; limit?: string; status?: string } }>,
      reply: FastifyReply,
    ) => {
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit ?? '20', 10)));
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (request.query.status) filter.status = request.query.status;

      const [clients, total] = await Promise.all([
        Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Client.countDocuments(filter),
      ]);

      sendSuccess(reply, { clients, total, page, pages: Math.ceil(total / limit) }, request);
    },
  });

  // Get client usage statistics
  fastify.get('/clients/:clientId/usage', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const { clientId } = request.params;
      const client = await Client.findOne({ clientId }).lean();
      if (!client) {
        sendError(reply, request, 'NOT_FOUND', 'Client not found', 404);
        return;
      }

      const [successfulReports, failedReports] = await Promise.all([
        Report.countDocuments({ clientId, status: 'completed' }),
        Report.countDocuments({ clientId, status: 'failed' }),
      ]);
      const totalReports = successfulReports + failedReports;

      sendSuccess(reply, { totalReports, successfulReports, failedReports }, request);
    },
  });

  // Get single client
  fastify.get('/clients/:clientId', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const client = await Client.findOne({ clientId: request.params.clientId }).lean();
      if (!client) {
        sendError(reply, request, 'NOT_FOUND', 'Client not found', 404);
        return;
      }
      sendSuccess(reply, client, request);
    },
  });

  // Create new client
  fastify.post('/clients', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Body: unknown }>,
      reply: FastifyReply,
    ) => {
      const body = createClientSchema.parse(request.body);

      const existing = await Client.findOne({ clientId: body.clientId }).lean();
      if (existing) {
        sendError(reply, request, 'CONFLICT', 'Client already exists', 409);
        return;
      }

      const client = await Client.create({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      reply.status(201);
      sendSuccess(reply, client.toObject(), request);
    },
  });

  // Update client
  fastify.put('/clients/:clientId', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string }; Body: unknown }>,
      reply: FastifyReply,
    ) => {
      const body = updateClientSchema.parse(request.body);

      const client = await Client.findOneAndUpdate(
        { clientId: request.params.clientId },
        { $set: { ...body, updatedAt: new Date() } },
        { new: true, lean: true },
      );

      if (!client) {
        sendError(reply, request, 'NOT_FOUND', 'Client not found', 404);
        return;
      }

      sendSuccess(reply, client, request);
    },
  });
}
