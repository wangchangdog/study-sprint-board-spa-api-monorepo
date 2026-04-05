import type {
  BoardRepository,
  RepositoryAuthResponse,
  RepositorySnapshot,
  SignInValues,
  TaskFormValues,
  CommentValues,
} from '../features/core/board-model'
import { env } from './env'

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

function buildUrl(pathname: string): string {
  return new URL(pathname, env.apiBaseUrl).toString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.error === 'string') {
    return payload.error
  }

  return fallback
}

async function request<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(pathname), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = response.status === 204 ? null : ((await response.json()) as unknown)

  if (!response.ok) {
    throw new ApiRequestError(
      getErrorMessage(payload, 'API との通信に失敗しました。'),
      response.status
    )
  }

  return payload as T
}

export function createApiRepository(): BoardRepository {
  return {
    mode: 'api',
    async initialize(): Promise<RepositorySnapshot> {
      try {
        return await request<RepositorySnapshot>('/api/board')
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          return {
            state: {
              users: [],
              labels: [],
              tasks: [],
              comments: [],
            },
            currentUserId: null,
          }
        }

        throw error
      }
    },
    async signIn(values: SignInValues): Promise<RepositoryAuthResponse> {
      const response = await fetch(buildUrl('/api/auth/signin'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const payload = ((await response.json()) as unknown) ?? null

      if (!response.ok) {
        return {
          ok: false,
          message: getErrorMessage(payload, 'サインインに失敗しました。'),
        }
      }

      if (!isRecord(payload) || typeof payload.userId !== 'string') {
        throw new Error('サインイン応答の形式が不正です。')
      }

      return {
        ok: true,
        userId: payload.userId,
      }
    },
    async signOut(): Promise<void> {
      await request('/api/auth/signout', {
        method: 'POST',
      })
    },
    async createTask(_currentUserId: string, values: TaskFormValues): Promise<void> {
      await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(values),
      })
    },
    async updateTask(taskId: string, values: TaskFormValues): Promise<void> {
      await request(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      })
    },
    async addComment(taskId: string, _authorId: string, values: CommentValues): Promise<void> {
      await request(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify(values),
      })
    },
  }
}
