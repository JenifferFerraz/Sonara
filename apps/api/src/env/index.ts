import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  PORT: z.coerce.number().default(3030),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  EXPIRES_IN: z.string().default('15m'),
  EXPIRES_IN_REFRESH_TOKEN: z.string().default('30d'),
  LICENSE_PRIVATE_KEY: z.string(),
  LICENSE_PUBLIC_KEY: z.string(),
  /** Origens do app web que podem chamar a API com cookie (separadas por vírgula). */
  WEB_ORIGIN: z.string().default('http://localhost:4200'),
  MASKS_DIR: z.string().default('../../libs/templates/src'),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
