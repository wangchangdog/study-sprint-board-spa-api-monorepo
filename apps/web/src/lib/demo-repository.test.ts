import { describe, expect, it } from 'vitest'

import { ADMIN_ACCOUNT, createSeedState } from '../features/core/board-model'
import {
  BOARD_STATE_KEY,
  SESSION_KEY,
  createDemoRepository,
  loadBoardState,
  loadCurrentUserId,
  persistBoardState,
  persistCurrentUserId,
  type StorageLike,
} from './demo-repository'

function createStorage(initial?: Record<string, string>): StorageLike {
  const store = new Map(Object.entries(initial ?? {}))
  return {
    getItem(key) {
      return store.get(key) ?? null
    },
    setItem(key, value) {
      store.set(key, value)
    },
    removeItem(key) {
      store.delete(key)
    },
  }
}

describe('demo-repository', () => {
  it('loads fallback state and ignores invalid JSON', () => {
    const fallbackDate = new Date('2026-04-04T00:00:00.000Z')
    expect(loadBoardState(undefined, fallbackDate).tasks).toHaveLength(10)
    expect(loadBoardState(createStorage({ [BOARD_STATE_KEY]: '{bad json' }), fallbackDate).tasks).toHaveLength(10)
    expect(loadBoardState(createStorage({ [BOARD_STATE_KEY]: 'null' }), fallbackDate).tasks).toHaveLength(10)
    expect(loadBoardState(createStorage({ [BOARD_STATE_KEY]: '{}' }), fallbackDate).tasks).toHaveLength(10)
    expect(loadCurrentUserId(undefined)).toBeNull()
  })

  it('persists state and current user id', () => {
    const storage = createStorage()
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    persistBoardState(storage, state)
    persistCurrentUserId(storage, ADMIN_ACCOUNT.id)
    expect(storage.getItem(BOARD_STATE_KEY)).not.toBeNull()
    expect(storage.getItem(SESSION_KEY)).toBe(ADMIN_ACCOUNT.id)
    persistCurrentUserId(storage, null)
    persistCurrentUserId(undefined, ADMIN_ACCOUNT.id)
    expect(storage.getItem(SESSION_KEY)).toBeNull()
  })

  it('supports initialize, sign-in, sign-out, create, update, and comment', async () => {
    const storage = createStorage()
    const repository = createDemoRepository({ storage, fallbackDate: new Date('2026-04-04T00:00:00.000Z') })

    const initial = await repository.initialize()
    expect(initial.currentUserId).toBeNull()

    const failed = await repository.signIn({ email: 'x@example.com', password: 'badpass00' })
    expect(failed.ok).toBe(false)

    const signedIn = await repository.signIn({ email: ADMIN_ACCOUNT.email, password: 'password123' })
    expect(signedIn.ok).toBe(true)

    await repository.createTask(ADMIN_ACCOUNT.id, {
      title: '追加',
      description: 'desc',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      assigneeId: null,
      labelIds: [],
    })

    let snapshot = await repository.initialize()
    expect(snapshot.state.tasks.some((task) => task.title === '追加')).toBe(true)

    const createdTaskId = snapshot.state.tasks.find((task) => task.title === '追加')!.id
    await repository.updateTask(createdTaskId, {
      title: '更新',
      description: 'changed',
      status: 'done',
      priority: 'urgent',
      dueDate: '2026-04-08',
      assigneeId: ADMIN_ACCOUNT.id,
      labelIds: [snapshot.state.labels[0]!.id],
    })
    await repository.addComment(createdTaskId, ADMIN_ACCOUNT.id, { content: 'コメント' })

    snapshot = await repository.initialize()
    expect(snapshot.state.tasks.find((task) => task.id === createdTaskId)?.title).toBe('更新')
    expect(snapshot.state.comments.some((comment) => comment.taskId === createdTaskId)).toBe(true)

    await repository.signOut()
    expect((await repository.initialize()).currentUserId).toBeNull()
  })
})
