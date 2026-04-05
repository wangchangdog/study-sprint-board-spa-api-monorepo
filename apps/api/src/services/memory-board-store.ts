import bcrypt from 'bcryptjs'
import {
  DEMO_ACCOUNTS,
  applyCreateComment,
  applyCreateTask,
  applyUpdateTask,
  cloneBoardState,
  createSeedState,
  type BoardState,
  type CommentValues,
  type TaskFormValues,
} from '@ssb/shared'

import { HttpError } from '../lib/errors'
import type { AuthUserRecord, BoardStore, SessionRecord } from './store'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function createMemoryBoardStore(options?: {
  state?: BoardState
  baseDate?: Date
}): Promise<BoardStore> {
  let state = cloneBoardState(options?.state ?? createSeedState(options?.baseDate ?? new Date('2026-04-04T00:00:00.000Z')))
  const passwordHashes = await Promise.all(
    DEMO_ACCOUNTS.map(async (account) => [
      account.email.toLowerCase(),
      await bcrypt.hash(account.password, 4),
    ] as const)
  )
  const passwordHashMap = new Map(passwordHashes)
  const sessions = new Map<string, { userId: string; expiresAt: Date }>()

  function getUser(userId: string) {
    const user = state.users.find((candidate) => candidate.id === userId)

    if (!user) {
      throw new HttpError(404, '対象のユーザーが見つかりません。')
    }

    return user
  }

  function ensureTask(taskId: string) {
    const task = state.tasks.find((candidate) => candidate.id === taskId)

    if (!task) {
      throw new HttpError(404, '対象のタスクが見つかりません。')
    }

    return task
  }

  return {
    async listUsers() {
      return clone(state.users)
    },
    async listLabels() {
      return clone(state.labels)
    },
    async listTasks() {
      return clone(state.tasks)
    },
    async listComments() {
      return clone(state.comments)
    },
    async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
      const user = state.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        return null
      }

      const passwordHash = passwordHashMap.get(user.email.toLowerCase())

      if (!passwordHash) {
        throw new Error('開発用アカウントのパスワードハッシュが見つかりません。')
      }

      return {
        ...clone(user),
        passwordHash,
      }
    },
    async findSession(token: string): Promise<SessionRecord | null> {
      const session = sessions.get(token)

      if (!session) {
        return null
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        sessions.delete(token)
        return null
      }

      return {
        token,
        user: clone(getUser(session.userId)),
        expiresAt: new Date(session.expiresAt),
      }
    },
    async createSession(userId: string, token: string, expiresAt: Date) {
      getUser(userId)
      sessions.set(token, {
        userId,
        expiresAt: new Date(expiresAt),
      })
    },
    async deleteSession(token: string) {
      sessions.delete(token)
    },
    async createTask(currentUserId: string, values: TaskFormValues) {
      getUser(currentUserId)
      state = applyCreateTask(state, currentUserId, values)
      return state.tasks[0]!.id
    },
    async updateTask(taskId: string, values: TaskFormValues) {
      ensureTask(taskId)
      state = applyUpdateTask(state, taskId, values)
    },
    async addComment(taskId: string, authorId: string, values: CommentValues) {
      ensureTask(taskId)
      getUser(authorId)
      const nextState = applyCreateComment(state, taskId, authorId, values)
      const createdComment = nextState.comments[nextState.comments.length - 1]
      state = nextState
      return createdComment!.id
    },
  }
}
