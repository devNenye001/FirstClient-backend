import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_ACCESS_SECRET: z.string().min(32).default('replace-with-at-least-32-characters-default-access'),
  JWT_REFRESH_SECRET: z.string().min(32).default('replace-with-at-least-32-characters-default-refresh'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  OVERPASS_URL: z.string().url().default('https://overpass-api.de/api/interpreter'),
  NOMINATIM_URL: z.string().url().default('https://nominatim.openstreetmap.org/search'),
  NOMINATIM_USER_AGENT: z.string().default('FirstClient/1.0'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_RECOMMENDATION_MODEL: z.string().default('gpt-4.1-mini'),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
})

export const env = schema.parse(process.env)
