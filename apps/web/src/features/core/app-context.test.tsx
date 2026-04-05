import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProvider } from './app-context'
import { ADMIN_ACCOUNT, createSeedState, type BoardRepository, type TaskFormValues } from './board-model'
import { useAppContext } from './use-app-context'

const VALID_TASK: TaskFormValues = {
  title: 'Task',
  description: 'desc',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  assigneeId: null,
  labelIds: [],
}

function createRepository(overrides?: Partial<BoardRepository> & { currentUserId?: string | null }): BoardRepository {
  const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
  const currentUserId =
    overrides && 'currentUserId' in overrides ? overrides.currentUserId ?? null : ADMIN_ACCOUNT.id
  return {
    mode: 'demo',
    initialize: async () => ({ state, currentUserId }),
    signIn: async () => ({ ok: true, userId: ADMIN_ACCOUNT.id }),
    signOut: async () => undefined,
    createTask: async () => undefined,
    updateTask: async () => undefined,
    addComment: async () => undefined,
    ...overrides,
  }
}

function ActionHarness({
  action,
}: {
  action(context: ReturnType<typeof useAppContext>): Promise<unknown>
}) {
  const context = useAppContext()
  const [result, setResult] = useState('')

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const value = await action(context)
          setResult(JSON.stringify(value))
        }}
      >
        run
      </button>
      <output data-testid="result">{result}</output>
    </div>
  )
}

function renderHarness(repository: BoardRepository, action: (context: ReturnType<typeof useAppContext>) => Promise<unknown>) {
  render(
    <MemoryRouter>
      <AppProvider repository={repository}>
        <ActionHarness action={action} />
      </AppProvider>
    </MemoryRouter>
  )
}

async function clickAndReadResult() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'run' }))
  await waitFor(() => expect(screen.getByTestId('result').textContent).not.toBe(''))
  return JSON.parse(screen.getByTestId('result').textContent ?? '{}')
}

afterEach(() => {
  cleanup()
})

describe('AppProvider action branches', () => {
  it('returns sign-in validation errors before reaching repository', async () => {
    const signIn = vi.fn()
    renderHarness(createRepository({ signIn }), (context) => context.signIn({ email: '', password: 'short' }))

    const result = await clickAndReadResult()
    expect(result.errors.email).toBe('メールアドレスを入力してください。')
    expect(signIn).not.toHaveBeenCalled()
  })

  it('returns repository sign-in failure message', async () => {
    renderHarness(
      createRepository({ signIn: async () => ({ ok: false, message: '失敗しました。' }) }),
      (context) => context.signIn({ email: ADMIN_ACCOUNT.email, password: 'password123' })
    )

    const result = await clickAndReadResult()
    expect(result.message).toBe('失敗しました。')
  })

  it('returns unknown exception message on sign-in error', async () => {
    renderHarness(
      createRepository({
        signIn: async () => {
          throw 'boom'
        },
      }),
      (context) => context.signIn({ email: ADMIN_ACCOUNT.email, password: 'password123' })
    )

    const result = await clickAndReadResult()
    expect(result.message).toBe('予期しないエラーが発生しました。')
  })

  it('returns createTask validation errors', async () => {
    renderHarness(createRepository(), (context) => context.createTask({ ...VALID_TASK, title: '' }))
    const result = await clickAndReadResult()
    expect(result.errors.title).toBe('タイトルを入力してください。')
  })

  it('returns unauthenticated message on createTask', async () => {
    renderHarness(createRepository({ currentUserId: null }), (context) => context.createTask(VALID_TASK))
    const result = await clickAndReadResult()
    expect(result.message).toBe('サインインが必要です。')
  })

  it('returns repository error message on createTask failure', async () => {
    renderHarness(
      createRepository({
        createTask: async () => {
          throw new Error('create failed')
        },
      }),
      (context) => context.createTask(VALID_TASK)
    )
    const result = await clickAndReadResult()
    expect(result.message).toBe('create failed')
  })

  it('returns updateTask validation errors', async () => {
    renderHarness(createRepository(), (context) => context.updateTask('task-1', { ...VALID_TASK, title: '' }))
    const result = await clickAndReadResult()
    expect(result.errors.title).toBe('タイトルを入力してください。')
  })

  it('returns repository error message on updateTask failure', async () => {
    renderHarness(
      createRepository({
        updateTask: async () => {
          throw new Error('update failed')
        },
      }),
      (context) => context.updateTask('task-1', VALID_TASK)
    )
    const result = await clickAndReadResult()
    expect(result.message).toBe('update failed')
  })

  it('returns addComment validation errors', async () => {
    renderHarness(createRepository(), (context) => context.addComment('task-1', { content: '' }))
    const result = await clickAndReadResult()
    expect(result.errors.content).toBe('コメントを入力してください。')
  })

  it('returns unauthenticated message on addComment', async () => {
    renderHarness(createRepository({ currentUserId: null }), (context) => context.addComment('task-1', { content: 'ok' }))
    const result = await clickAndReadResult()
    expect(result.message).toBe('サインインが必要です。')
  })

  it('returns repository error message on addComment failure', async () => {
    renderHarness(
      createRepository({
        addComment: async () => {
          throw new Error('comment failed')
        },
      }),
      (context) => context.addComment('task-1', { content: 'ok' })
    )
    const result = await clickAndReadResult()
    expect(result.message).toBe('comment failed')
  })

  it('does not update state after unmounting during initialize', async () => {
    let resolveInitialize: ((value: { state: ReturnType<typeof createSeedState>; currentUserId: string | null }) => void) | undefined

    const repository = createRepository({
      initialize: () =>
        new Promise((resolve) => {
          resolveInitialize = resolve
        }),
    })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { unmount } = render(
      <MemoryRouter>
        <AppProvider repository={repository}>
          <div>loading</div>
        </AppProvider>
      </MemoryRouter>
    )

    unmount()
    resolveInitialize?.({
      state: createSeedState(new Date('2026-04-04T00:00:00.000Z')),
      currentUserId: ADMIN_ACCOUNT.id,
    })
    await Promise.resolve()

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
