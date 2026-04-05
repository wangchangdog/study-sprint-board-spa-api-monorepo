import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  commentSchema,
  formatZodErrors,
  signInSchema,
  taskFormSchema,
} from '@ssb/shared'
import { z } from 'zod'

import { HttpError, isHttpError } from './lib/errors'
import { createSessionCookieOptions } from './lib/session'
import {
  addComment,
  createSessionForSignIn,
  createTask,
  getDashboardSummary,
  getTask,
  listTasks,
  loadSnapshot,
  requireSessionUser,
  updateTask,
} from './services/board-service'
import type { BoardStore } from './services/store'

const taskFiltersSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: z.string().trim().min(1).optional(),
})

const taskIdParamsSchema = z.object({
  taskId: z.string().trim().min(1),
})

type AppOptions = {
  store: BoardStore
  cookieName?: string
  allowedOrigin?: string
}

function parseOrThrow<T>(result: z.ZodSafeParseResult<T>) {
  if (!result.success) {
    throw new HttpError(400, 'バリデーションエラーです。', formatZodErrors(result.error))
  }

  return result.data
}

export function createApp(options: AppOptions) {
  const app = express()
  const cookieName = options.cookieName ?? 'study_sprint_board_session'
  const allowedOrigin = options.allowedOrigin ?? 'http://localhost:4173'
  const secure = allowedOrigin.startsWith('https://')

  const getSessionToken = (request: express.Request) => {
    const token = request.cookies?.[cookieName]
    return typeof token === 'string' ? token : null
  }

  const getCurrentUser = async (request: express.Request) => {
    return requireSessionUser(options.store, getSessionToken(request))
  }

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  )
  app.use(cookieParser())
  app.use(express.json())

  app.get('/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.post('/api/auth/signin', async (request, response, next) => {
    try {
      const values = parseOrThrow(signInSchema.safeParse(request.body))
      const { userId, sessionToken } = await createSessionForSignIn(options.store, values)

      response.cookie(cookieName, sessionToken, createSessionCookieOptions(secure))
      response.json({ userId })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/auth/signout', async (request, response, next) => {
    try {
      const sessionToken = getSessionToken(request)

      if (sessionToken) {
        await options.store.deleteSession(sessionToken)
      }

      response.clearCookie(cookieName, createSessionCookieOptions(secure))
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/board', async (request, response, next) => {
    try {
      const user = await getCurrentUser(request)
      response.json(await loadSnapshot(options.store, user.id))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/tasks', async (request, response, next) => {
    try {
      await getCurrentUser(request)
      const filters = parseOrThrow(taskFiltersSchema.safeParse(request.query))
      response.json(await listTasks(options.store, filters))
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/tasks', async (request, response, next) => {
    try {
      const user = await getCurrentUser(request)
      const values = parseOrThrow(taskFormSchema.safeParse(request.body))
      response.status(201).json(await createTask(options.store, user.id, values))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/tasks/:taskId', async (request, response, next) => {
    try {
      await getCurrentUser(request)
      const { taskId } = parseOrThrow(taskIdParamsSchema.safeParse(request.params))
      response.json(await getTask(options.store, taskId))
    } catch (error) {
      next(error)
    }
  })

  app.patch('/api/tasks/:taskId', async (request, response, next) => {
    try {
      await getCurrentUser(request)
      const { taskId } = parseOrThrow(taskIdParamsSchema.safeParse(request.params))
      const values = parseOrThrow(taskFormSchema.safeParse(request.body))
      response.json(await updateTask(options.store, taskId, values))
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/tasks/:taskId/comments', async (request, response, next) => {
    try {
      const user = await getCurrentUser(request)
      const { taskId } = parseOrThrow(taskIdParamsSchema.safeParse(request.params))
      const values = parseOrThrow(commentSchema.safeParse(request.body))
      response.status(201).json(await addComment(options.store, taskId, user.id, values))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/dashboard/summary', async (request, response, next) => {
    try {
      const user = await getCurrentUser(request)
      response.json(await getDashboardSummary(options.store, user.id))
    } catch (error) {
      next(error)
    }
  })

  app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
    void next

    if (isHttpError(error)) {
      response.status(error.status).json(
        error.details
          ? {
              error: error.message,
              details: error.details,
            }
          : {
              error: error.message,
            }
      )
      return
    }

    console.error(error)
    response.status(500).json({ error: 'サーバー内部でエラーが発生しました。' })
  })

  return app
}
