import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { requestStartPreHandler, sendSuccess, sendError } from '../../utils/apiResponse.js';
import { Mapping } from '../../models/mapping.model.js';

const preHandlers = [requestStartPreHandler, authenticatePreHandler];

const mappingUpdateSchema = z.object({
  idMapping: z.record(z.string()).optional(),
  nameMapping: z.record(z.string()).optional(),
  profileMapping: z.record(z.string()).optional(),
  parameterOrder: z.array(z.string()).optional(),
  profileOrder: z.array(z.string()).optional(),
});

export async function mappingRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/mappings/:clientId', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply,
    ) => {
      const { clientId } = request.params;
      const doc = await Mapping.findOne({ clientId }).lean();
      if (!doc) {
        sendError(
          reply,
          request,
          'NOT_FOUND',
          'Mappings not found for this client',
          404,
        );
        return;
      }
      sendSuccess(
        reply,
        {
          clientId: doc.clientId,
          type: doc.type,
          idMapping: doc.idMapping ?? {},
          nameMapping: doc.nameMapping ?? {},
          profileMapping: doc.profileMapping ?? {},
          parameterOrder: doc.parameterOrder ?? [],
          profileOrder: doc.profileOrder ?? [],
          updatedAt: doc.updatedAt,
          version: doc.version,
        },
        request,
      );
    },
  });

  fastify.put('/mappings/:clientId', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string }; Body: unknown }>,
      reply: FastifyReply,
    ) => {
      const body = mappingUpdateSchema.parse(request.body);
      const { clientId } = request.params;

      const updateDoc: Record<string, unknown> = {
        updatedAt: new Date(),
        clientId,
      };
      if (body.idMapping !== undefined) updateDoc.idMapping = body.idMapping;
      if (body.nameMapping !== undefined) updateDoc.nameMapping = body.nameMapping;
      if (body.profileMapping !== undefined) updateDoc.profileMapping = body.profileMapping;
      if (body.parameterOrder !== undefined) updateDoc.parameterOrder = body.parameterOrder;
      if (body.profileOrder !== undefined) updateDoc.profileOrder = body.profileOrder;

      const doc = await Mapping.findOneAndUpdate(
        { clientId },
        { $set: updateDoc, $setOnInsert: { type: 'parameter' } },
        { upsert: true, new: true, lean: true },
      );
      if (!doc) {
        sendError(reply, request, 'UPDATE_FAILED', 'Failed to save mappings', 500);
        return;
      }

      sendSuccess(
        reply,
        {
          clientId: doc.clientId,
          type: doc.type,
          idMapping: doc.idMapping ?? {},
          nameMapping: doc.nameMapping ?? {},
          profileMapping: doc.profileMapping ?? {},
          parameterOrder: doc.parameterOrder ?? [],
          profileOrder: doc.profileOrder ?? [],
          updatedAt: doc.updatedAt,
          version: doc.version,
        },
        request,
      );
    },
  });
}

