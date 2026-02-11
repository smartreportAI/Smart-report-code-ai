import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticatePreHandler } from '../../plugins/auth.plugin.js';
import { requestStartPreHandler, sendSuccess, sendError } from '../../utils/apiResponse.js';
import { Biomarker } from '../../models/biomarker.model.js';

const preHandlers = [requestStartPreHandler, authenticatePreHandler];

export async function biomarkerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/biomarkers', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{
        Querystring: { page?: string; limit?: string; category?: string; profile?: string; search?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit ?? '20', 10) || 20));
      const skip = (page - 1) * limit;
      const { category, profile, search } = request.query;

      const filter: Record<string, unknown> = {};
      if (category) filter.category = category;
      if (profile) filter.profiles = profile;
      if (search && search.trim()) {
        const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { standardName: new RegExp(term, 'i') },
          { aliases: new RegExp(term, 'i') },
        ];
      }

      const [items, total] = await Promise.all([
        Biomarker.find(filter).sort({ standardName: 1 }).skip(skip).limit(limit).lean(),
        Biomarker.countDocuments(filter),
      ]);

      sendSuccess(
        reply,
        {
          items,
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        request,
      );
    },
  });

  fastify.get('/biomarkers/:id', {
    preHandler: preHandlers,
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const doc = await Biomarker.findOne({ biomarkerId: id }).lean();
      if (!doc) {
        sendError(reply, request, 'NOT_FOUND', 'Biomarker not found', 404);
        return;
      }
      sendSuccess(reply, doc, request);
    },
  });
}
