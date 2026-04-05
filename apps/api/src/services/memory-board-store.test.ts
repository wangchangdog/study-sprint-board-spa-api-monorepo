import bcrypt from 'bcryptjs'
import { describe, expect, it } from 'vitest'

import { createSeedState } from '@ssb/shared'

import { createMemoryBoardStore } from './memory-board-store'

describe('memory-board-store', () => {
  it('returns null for unknown users and unknown sessions', async () => {
    const store = await createMemoryBoardStore()

    await expect(store.findUserByEmail('missing@example.com')).resolves.toBeNull()
    await expect(store.findSession('missing-session')).resolves.toBeNull()
  })

  it('throws when a known user has no password hash entry', async () => {
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    state.users[0] = {
      ...state.users[0]!,
      email: 'external-user@example.com',
    }

    const store = await createMemoryBoardStore({ state })

    await expect(store.findUserByEmail('external-user@example.com')).rejects.toThrow(
      '開発用アカウントのパスワードハッシュが見つかりません。'
    )
  })

  it('drops expired sessions and rejects missing users for session creation', async () => {
    const store = await createMemoryBoardStore()
    const expiredDate = new Date(Date.now() - 60_000)

    await store.createSession(
      '11111111-1111-4111-8111-111111111111',
      'expired-session',
      expiredDate
    )
    await expect(store.findSession('expired-session')).resolves.toBeNull()

    await expect(
      store.createSession('missing-user-id', 'bad-session', new Date(Date.now() + 60_000))
    ).rejects.toMatchObject({
      status: 404,
      message: '対象のユーザーが見つかりません。',
    })
  })

  it('rejects comment creation when the task or author does not exist', async () => {
    const store = await createMemoryBoardStore()

    await expect(
      store.addComment('missing-task-id', '11111111-1111-4111-8111-111111111111', {
        content: 'missing task',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: '対象のタスクが見つかりません。',
    })

    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    const storeWithKnownTask = await createMemoryBoardStore({ state })

    await expect(
      storeWithKnownTask.addComment(state.tasks[0]!.id, 'missing-user-id', {
        content: 'missing author',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: '対象のユーザーが見つかりません。',
    })
  })

  it('persists sessions and writes task updates', async () => {
    const store = await createMemoryBoardStore()
    const passwordRecord = await store.findUserByEmail('admin@example.com')
    expect(passwordRecord).not.toBeNull()
    expect(await bcrypt.compare('password123', passwordRecord!.passwordHash)).toBe(true)

    await store.createSession(
      '11111111-1111-4111-8111-111111111111',
      'active-session',
      new Date(Date.now() + 60_000)
    )
    await expect(store.findSession('active-session')).resolves.toMatchObject({
      user: {
        id: '11111111-1111-4111-8111-111111111111',
      },
    })

    const taskId = await store.createTask('11111111-1111-4111-8111-111111111111', {
      title: 'memory store task',
      description: 'created in test',
      status: 'todo',
      priority: 'low',
      dueDate: null,
      assigneeId: null,
      labelIds: [],
    })

    await store.updateTask(taskId, {
      title: 'memory store task updated',
      description: 'updated in test',
      status: 'done',
      priority: 'high',
      dueDate: '2026-04-08',
      assigneeId: '22222222-2222-4222-8222-222222222222',
      labelIds: ['aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'],
    })

    const tasks = await store.listTasks()
    const updatedTask = tasks.find((task) => task.id === taskId)
    expect(updatedTask).toMatchObject({
      title: 'memory store task updated',
      status: 'done',
      priority: 'high',
      assigneeId: '22222222-2222-4222-8222-222222222222',
      labelIds: ['aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'],
    })

    await store.deleteSession('active-session')
    await expect(store.findSession('active-session')).resolves.toBeNull()
  })
})
