import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
})

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4010),
  APP_WEB_URL: z.string().url().default('http://localhost:4173'),
  SESSION_COOKIE_NAME: z.string().min(1).default('study_sprint_board_session'),
})

export const env = envSchema.parse(process.env)
