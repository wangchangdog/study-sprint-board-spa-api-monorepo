import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createApp } from './app'
import { createMemoryBoardStore } from './services/memory-board-store'

const TEST_COOKIE_NAME = 'study_sprint_board_test_session'

async function createTestAgent() {
  const store = await createMemoryBoardStore()
  const app = createApp({
    store,
    cookieName: TEST_COOKIE_NAME,
    allowedOrigin: 'http://localhost:4173',
  })

  return {
    store,
    app,
    agent: request.agent(app),
  }
}

async function signInAsAdmin(agent: request.Agent) {
  const response = await agent.post('/api/auth/signin').send({
    email: 'admin@example.com',
    password: 'password123',
  })

  expect(response.status).toBe(200)
  expect(response.body.userId).toBe('11111111-1111-4111-8111-111111111111')
}

describe('createApp', () => {
  let context: Awaited<ReturnType<typeof createTestAgent>>

  beforeEach(async () => {
    context = await createTestAgent()
  })

  it('responds to the health check and blocks unauthenticated access', async () => {
    const healthResponse = await request(context.app).get('/health')
    expect(healthResponse.status).toBe(200)
    expect(healthResponse.body).toEqual({ ok: true })

    const tasksResponse = await request(context.app).get('/api/tasks')
    expect(tasksResponse.status).toBe(401)
    expect(tasksResponse.body).toEqual({ error: 'サインインが必要です。' })

    const boardResponse = await request(context.app).get('/api/board')
    expect(boardResponse.status).toBe(401)
    expect(boardResponse.body).toEqual({ error: 'サインインが必要です。' })
  })

  it('creates and clears a session cookie through the auth routes', async () => {
    const failedResponse = await context.agent.post('/api/auth/signin').send({
      email: 'admin@example.com',
      password: 'wrong-password',
    })

    expect(failedResponse.status).toBe(401)
    expect(failedResponse.body).toEqual({
      error: 'メールアドレスまたはパスワードが正しくありません。',
    })

    await signInAsAdmin(context.agent)

    const boardResponse = await context.agent.get('/api/board')
    expect(boardResponse.status).toBe(200)
    expect(boardResponse.body.currentUserId).toBe('11111111-1111-4111-8111-111111111111')
    expect(boardResponse.body.state.tasks).toHaveLength(10)

    const signOutResponse = await context.agent.post('/api/auth/signout')
    expect(signOutResponse.status).toBe(204)
    expect(signOutResponse.headers['set-cookie']?.[0]).toContain(`${TEST_COOKIE_NAME}=;`)

    const afterSignOutResponse = await context.agent.get('/api/dashboard/summary')
    expect(afterSignOutResponse.status).toBe(401)
  })

  it('supports task listing, creation, update, comments, and dashboard summary', async () => {
    await signInAsAdmin(context.agent)

    const listResponse = await context.agent.get('/api/tasks').query({ status: 'todo' })
    expect(listResponse.status).toBe(200)
    expect(listResponse.body.length).toBeGreaterThan(0)
    expect(listResponse.body.every((task: { status: string }) => task.status === 'todo')).toBe(true)

    const createResponse = await context.agent.post('/api/tasks').send({
      title: '分離 API 向けのサンプルを整える',
      description: 'POST /api/tasks の動作確認用に作成する。',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-04-10',
      assigneeId: '22222222-2222-4222-8222-222222222222',
      labelIds: ['aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'],
    })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.title).toBe('分離 API 向けのサンプルを整える')
    expect(createResponse.body.labels).toHaveLength(1)
    expect(createResponse.body.createdBy.id).toBe('11111111-1111-4111-8111-111111111111')

    const createdTaskId = createResponse.body.id as string

    const detailResponse = await context.agent.get(`/api/tasks/${createdTaskId}`)
    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.id).toBe(createdTaskId)

    const updateResponse = await context.agent.patch(`/api/tasks/${createdTaskId}`).send({
      title: '分離 API 向けの見本を完成させる',
      description: 'PATCH /api/tasks/:id の動作確認を兼ねる。',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: null,
      assigneeId: '33333333-3333-4333-8333-333333333333',
      labelIds: [
        'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
        'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      ],
    })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.status).toBe('in_progress')
    expect(updateResponse.body.labels).toHaveLength(2)
    expect(updateResponse.body.assignee.id).toBe('33333333-3333-4333-8333-333333333333')

    const commentResponse = await context.agent.post(`/api/tasks/${createdTaskId}/comments`).send({
      content: 'コメント API も接続できました。',
    })

    expect(commentResponse.status).toBe(201)
    expect(commentResponse.body.content).toBe('コメント API も接続できました。')
    expect(commentResponse.body.author.id).toBe('11111111-1111-4111-8111-111111111111')

    const summaryResponse = await context.agent.get('/api/dashboard/summary')
    expect(summaryResponse.status).toBe(200)
    expect(summaryResponse.body.assignedToMe).toBeGreaterThanOrEqual(0)
    expect(summaryResponse.body.statusCounts.in_progress).toBeGreaterThanOrEqual(1)
    expect(summaryResponse.body.recentlyUpdated.length).toBeGreaterThan(0)
  })

  it('returns validation and not-found errors for invalid requests', async () => {
    await signInAsAdmin(context.agent)

    const invalidQueryResponse = await context.agent.get('/api/tasks').query({ status: 'invalid-status' })
    expect(invalidQueryResponse.status).toBe(400)
    expect(invalidQueryResponse.body.error).toBe('バリデーションエラーです。')
    expect(invalidQueryResponse.body.details.status).toBeTruthy()

    const invalidCreateResponse = await context.agent.post('/api/tasks').send({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      assigneeId: null,
      labelIds: [],
    })

    expect(invalidCreateResponse.status).toBe(400)
    expect(invalidCreateResponse.body.details.title).toBe('タイトルを入力してください。')

    const missingTaskResponse = await context.agent.get('/api/tasks/missing-task-id')
    expect(missingTaskResponse.status).toBe(404)
    expect(missingTaskResponse.body).toEqual({ error: '対象のタスクが見つかりません。' })

    const missingUpdateResponse = await context.agent.patch('/api/tasks/missing-task-id').send({
      title: '存在しないタスク',
      description: '',
      status: 'todo',
      priority: 'low',
      dueDate: null,
      assigneeId: null,
      labelIds: [],
    })

    expect(missingUpdateResponse.status).toBe(404)
    expect(missingUpdateResponse.body).toEqual({ error: '対象のタスクが見つかりません。' })

    const missingCommentResponse = await context.agent.post('/api/tasks/missing-task-id/comments').send({
      content: '存在しないタスクへのコメント',
    })

    expect(missingCommentResponse.status).toBe(404)
    expect(missingCommentResponse.body).toEqual({ error: '対象のタスクが見つかりません。' })
  })

  it('uses default cookie settings and allows sign-out without a session', async () => {
    const store = await createMemoryBoardStore()
    const deleteSession = vi.fn(store.deleteSession.bind(store))
    const app = createApp({
      store: {
        ...store,
        deleteSession,
      },
    })

    const response = await request(app).post('/api/auth/signout')

    expect(response.status).toBe(204)
    expect(response.headers['set-cookie']?.[0]).toContain('study_sprint_board_session=;')
    expect(deleteSession).not.toHaveBeenCalled()
  })

  it('returns 500 when the store throws an unexpected error', async () => {
    const baseContext = await createTestAgent()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const app = createApp({
      store: {
        ...baseContext.store,
        async deleteSession() {
          throw new Error('unexpected sign-out failure')
        },
      },
      cookieName: TEST_COOKIE_NAME,
      allowedOrigin: 'http://localhost:4173',
    })
    const agent = request.agent(app)

    await signInAsAdmin(agent)
    const response = await agent.post('/api/auth/signout')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'サーバー内部でエラーが発生しました。' })

    consoleSpy.mockRestore()
  })
})
