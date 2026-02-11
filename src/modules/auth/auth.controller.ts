import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as authService from './auth.service.js';
import type { JwtPayload } from '../../types/index.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
): Promise<void> {
  const body = registerSchema.parse(request.body);
  const user = await authService.register(body.email, body.password);
  await reply.status(201).send(user);
}

export async function login(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
): Promise<void> {
  const body = loginSchema.parse(request.body);
  const sign = (payload: JwtPayload) => request.server.jwt.sign(payload);
  const { token } = await authService.login(body.email, body.password, sign);
  await reply.send({ token });
}
