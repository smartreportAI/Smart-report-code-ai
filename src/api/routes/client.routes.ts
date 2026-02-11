import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { Client } from '../../models/client.model.js';

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
    preHandler: [authenticatePreHandler],
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

      await reply.send({ clients, total, page, pages: Math.ceil(total / limit) });
    },
  });

  // Get single client
  fastify.get('/clients/:clientId', {
    preHandler: [authenticatePreHandler],
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const client = await Client.findOne({ clientId: request.params.clientId }).lean();
      if (!client) {
        await reply.status(404).send({ error: 'Client not found' });
        return;
      }
      await reply.send(client);
    },
  });

  // Create new client
  fastify.post('/clients', {
    preHandler: [authenticatePreHandler],
    handler: async (
      request: FastifyRequest<{ Body: unknown }>,
      reply: FastifyReply,
    ) => {
      const body = createClientSchema.parse(request.body);

      const existing = await Client.findOne({ clientId: body.clientId }).lean();
      if (existing) {
        await reply.status(409).send({ error: 'Client already exists' });
        return;
      }

      const client = await Client.create({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await reply.status(201).send(client.toObject());
    },
  });

  // Update client
  fastify.put('/clients/:clientId', {
    preHandler: [authenticatePreHandler],
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
        await reply.status(404).send({ error: 'Client not found' });
        return;
      }

      await reply.send(client);
    },
  });
}
