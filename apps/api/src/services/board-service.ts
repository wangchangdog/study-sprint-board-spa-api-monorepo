import bcrypt from 'bcryptjs'
import {
  buildDashboardSummary,
  createTaskViews,
  type CommentValues,
  type DashboardSummary,
  type RepositorySnapshot,
  type SignInValues,
  type TaskFormValues,
  type TaskView,
} from '@ssb/shared'

import { HttpError } from '../lib/errors'
import { createSessionExpiresAt, createSessionToken } from '../lib/session'
import type { BoardStore, TaskFilters } from './store'

async function loadBoardState(store: BoardStore) {
  const [users, labels, tasks, comments] = await Promise.all([
    store.listUsers(),
    store.listLabels(),
    store.listTasks(),
    store.listComments(),
  ])

  return {
    users,
    labels,
    tasks,
    comments,
  }
}

export async function requireSessionUser(store: BoardStore, sessionToken: string | null) {
  if (!sessionToken) {
    throw new HttpError(401, 'サインインが必要です。')
  }

  const session = await store.findSession(sessionToken)

  if (!session) {
    throw new HttpError(401, 'サインインが必要です。')
  }

  return session.user
}

export async function createSessionForSignIn(store: BoardStore, values: SignInValues) {
  const user = await store.findUserByEmail(values.email.trim().toLowerCase())

  if (!user) {
    throw new HttpError(401, 'メールアドレスまたはパスワードが正しくありません。')
  }

  const isValid = await bcrypt.compare(values.password, user.passwordHash)

  if (!isValid) {
    throw new HttpError(401, 'メールアドレスまたはパスワードが正しくありません。')
  }

  const sessionToken = createSessionToken()
  const expiresAt = createSessionExpiresAt()
  await store.createSession(user.id, sessionToken, expiresAt)

  return {
    userId: user.id,
    sessionToken,
  }
}

export async function loadSnapshot(store: BoardStore, currentUserId: string): Promise<RepositorySnapshot> {
  return {
    state: await loadBoardState(store),
    currentUserId,
  }
}

export async function listTasks(store: BoardStore, filters: TaskFilters): Promise<TaskView[]> {
  const views = createTaskViews(await loadBoardState(store))

  return views.filter((task) => {
    if (filters.status && task.status !== filters.status) {
      return false
    }

    if (filters.priority && task.priority !== filters.priority) {
      return false
    }

    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) {
      return false
    }

    return true
  })
}

export async function getTask(store: BoardStore, taskId: string): Promise<TaskView> {
  const task = (await listTasks(store, {})).find((candidate) => candidate.id === taskId)

  if (!task) {
    throw new HttpError(404, '対象のタスクが見つかりません。')
  }

  return task
}

export async function createTask(store: BoardStore, currentUserId: string, values: TaskFormValues) {
  const taskId = await store.createTask(currentUserId, values)
  return getTask(store, taskId)
}

export async function updateTask(store: BoardStore, taskId: string, values: TaskFormValues) {
  await store.updateTask(taskId, values)
  return getTask(store, taskId)
}

export async function addComment(
  store: BoardStore,
  taskId: string,
  authorId: string,
  values: CommentValues
) {
  const commentId = await store.addComment(taskId, authorId, values)
  const task = await getTask(store, taskId)
  const comment = task.comments.find((candidate) => candidate.id === commentId)

  if (!comment) {
    throw new Error('コメント作成後の整合性確認に失敗しました。')
  }

  return comment
}

export async function getDashboardSummary(
  store: BoardStore,
  currentUserId: string
): Promise<DashboardSummary> {
  return buildDashboardSummary(await loadBoardState(store), currentUserId)
}
