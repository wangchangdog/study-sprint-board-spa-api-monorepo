import { describe, expect, it } from 'vitest'

import {
  addComment,
  createSessionForSignIn,
  listTasks,
  requireSessionUser,
} from './board-service'
import { createMemoryBoardStore } from './memory-board-store'

describe('board-service', () => {
  it('rejects missing or unknown sessions', async () => {
    const store = await createMemoryBoardStore()

    await expect(requireSessionUser(store, null)).rejects.toMatchObject({
      status: 401,
      message: 'サインインが必要です。',
    })
    await expect(requireSessionUser(store, 'missing-session')).rejects.toMatchObject({
      status: 401,
      message: 'サインインが必要です。',
    })
  })

  it('rejects missing users and invalid passwords during sign-in', async () => {
    const store = await createMemoryBoardStore()

    await expect(
      createSessionForSignIn(store, {
        email: 'missing@example.com',
        password: 'password123',
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'メールアドレスまたはパスワードが正しくありません。',
    })

    await expect(
      createSessionForSignIn(store, {
        email: 'admin@example.com',
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'メールアドレスまたはパスワードが正しくありません。',
    })
  })

  it('filters tasks by priority and assignee', async () => {
    const store = await createMemoryBoardStore()

    const highPriorityTasks = await listTasks(store, { priority: 'high' })
    expect(highPriorityTasks.length).toBeGreaterThan(0)
    expect(highPriorityTasks.every((task) => task.priority === 'high')).toBe(true)

    const assigneeTasks = await listTasks(store, {
      assigneeId: '22222222-2222-4222-8222-222222222222',
    })
    expect(assigneeTasks.length).toBeGreaterThan(0)
    expect(
      assigneeTasks.every((task) => task.assigneeId === '22222222-2222-4222-8222-222222222222')
    ).toBe(true)
  })

  it('throws when a created comment cannot be found in the refreshed task view', async () => {
    const brokenStore = {
      listUsers: async () => [
        {
          id: 'user-id',
          email: 'user@example.com',
          name: 'Example User',
          role: 'user' as const,
        },
      ],
      listLabels: async () => [],
      listTasks: async () => [
        {
          id: 'task-id',
          title: 'broken task',
          description: '',
          status: 'todo' as const,
          priority: 'low' as const,
          dueDate: null,
          assigneeId: null,
          createdById: 'user-id',
          labelIds: [],
          createdAt: '2026-04-04T00:00:00.000Z',
          updatedAt: '2026-04-04T00:00:00.000Z',
        },
      ],
      listComments: async () => [],
      findUserByEmail: async () => null,
      findSession: async () => null,
      createSession: async () => undefined,
      deleteSession: async () => undefined,
      createTask: async () => 'unused',
      updateTask: async () => undefined,
      addComment: async () => 'missing-comment-id',
    }

    await expect(
      addComment(brokenStore, 'task-id', 'user-id', {
        content: '整合性確認',
      })
    ).rejects.toThrow('コメント作成後の整合性確認に失敗しました。')
  })

  it('creates a real session token for valid credentials', async () => {
    const store = await createMemoryBoardStore()

    const result = await createSessionForSignIn(store, {
      email: 'admin@example.com',
      password: 'password123',
    })

    expect(result.userId).toBe('11111111-1111-4111-8111-111111111111')
    expect(typeof result.sessionToken).toBe('string')
    expect(result.sessionToken.length).toBeGreaterThan(0)

    const sessionUser = await requireSessionUser(store, result.sessionToken)
    expect(sessionUser.email).toBe('admin@example.com')
  })
})
