import { afterEach, describe, expect, it, vi } from 'vitest'

const originalFetch = globalThis.fetch

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.doUnmock('./env')
  globalThis.fetch = originalFetch
})

describe('api-repository', () => {
  it('initializes a snapshot from the API', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse({
        state: {
          users: [],
          labels: [],
          tasks: [],
          comments: [],
        },
        currentUserId: null,
      })
    )

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(repository.initialize()).resolves.toEqual({
      state: {
        users: [],
        labels: [],
        tasks: [],
        comments: [],
      },
      currentUserId: null,
    })

    expect(fetchMock).toHaveBeenCalledWith('http://api.example.test/api/board', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('returns an empty snapshot when initialize receives 401', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse(
        {
          error: 'サインインが必要です。',
        },
        { status: 401 }
      )
    )

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(repository.initialize()).resolves.toEqual({
      state: {
        users: [],
        labels: [],
        tasks: [],
        comments: [],
      },
      currentUserId: null,
    })
  })

  it('returns a failed auth response when sign-in is rejected', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse(
        {
          error: 'メールアドレスまたはパスワードが正しくありません。',
        },
        { status: 401 }
      )
    )

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(
      repository.signIn({
        email: 'admin@example.com',
        password: 'password123',
      })
    ).resolves.toEqual({
      ok: false,
      message: 'メールアドレスまたはパスワードが正しくありません。',
    })
  })

  it('returns a successful auth response when sign-in succeeds', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse({
        userId: '11111111-1111-4111-8111-111111111111',
      })
    )

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(
      repository.signIn({
        email: 'admin@example.com',
        password: 'password123',
      })
    ).resolves.toEqual({
      ok: true,
      userId: '11111111-1111-4111-8111-111111111111',
    })
  })

  it('falls back to the default message when sign-in fails without a payload', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => undefined,
    }))

    globalThis.fetch = fetchMock as unknown as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(
      repository.signIn({
        email: 'admin@example.com',
        password: 'password123',
      })
    ).resolves.toEqual({
      ok: false,
      message: 'サインインに失敗しました。',
    })
  })

  it('throws when sign-in returns an invalid payload', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({ ok: true }))

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(
      repository.signIn({
        email: 'admin@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('サインイン応答の形式が不正です。')
  })

  it('uses the shared request helper for write operations', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'task-1' }, { status: 201 }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'task-1' }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'comment-1' }, { status: 201 }))

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(repository.signOut()).resolves.toBeUndefined()
    await expect(
      repository.createTask('ignored-user-id', {
        title: 'API 経由でタスク作成',
        description: 'POST /api/tasks を呼び出す',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        assigneeId: null,
        labelIds: [],
      })
    ).resolves.toBeUndefined()
    await expect(
      repository.updateTask('task-1', {
        title: 'API 経由でタスク更新',
        description: 'PATCH /api/tasks/:id を呼び出す',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-04-05',
        assigneeId: '22222222-2222-4222-8222-222222222222',
        labelIds: ['aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'],
      })
    ).resolves.toBeUndefined()
    await expect(
      repository.addComment('task-1', 'ignored-author-id', {
        content: 'API 経由でコメント投稿',
      })
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://api.example.test/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://api.example.test/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'API 経由でタスク作成',
        description: 'POST /api/tasks を呼び出す',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        assigneeId: null,
        labelIds: [],
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://api.example.test/api/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'API 経由でタスク更新',
        description: 'PATCH /api/tasks/:id を呼び出す',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-04-05',
        assigneeId: '22222222-2222-4222-8222-222222222222',
        labelIds: ['aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'],
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(4, 'http://api.example.test/api/tasks/task-1/comments', {
      method: 'POST',
      body: JSON.stringify({
        content: 'API 経由でコメント投稿',
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('surfaces a fallback message when a write request fails without an error payload', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({}, { status: 500 }))

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(
      repository.updateTask('task-1', {
        title: '失敗する更新',
        description: '',
        status: 'todo',
        priority: 'low',
        dueDate: null,
        assigneeId: null,
        labelIds: [],
      })
    ).rejects.toThrow('API との通信に失敗しました。')
  })

  it('rethrows initialize errors other than 401', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse(
        {
          error: 'サーバーエラーです。',
        },
        { status: 500 }
      )
    )

    globalThis.fetch = fetchMock as typeof fetch
    vi.doMock('./env', () => ({ env: { enableApi: true, apiBaseUrl: 'http://api.example.test' } }))

    const { createApiRepository } = await import('./api-repository')
    const repository = createApiRepository()

    await expect(repository.initialize()).rejects.toThrow('サーバーエラーです。')
  })
})
