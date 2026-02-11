import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().url(),
  JWT_SECRET: z.string().min(10),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
