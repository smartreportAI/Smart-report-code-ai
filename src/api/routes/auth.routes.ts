import type { FastifyInstance } from 'fastify';
import * as authController from '../../modules/auth/auth.controller.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/auth/register', authController.register);
  fastify.post('/auth/login', authController.login);
}
