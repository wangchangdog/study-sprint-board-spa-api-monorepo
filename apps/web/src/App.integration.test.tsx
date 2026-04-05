import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from './App'
import { EmptyState } from './components/empty-state'
import { AppProvider } from './features/core/app-context'
import { AppContext } from './features/core/app-context-shared'
import {
  ADMIN_ACCOUNT,
  USER_ONE_ACCOUNT,
  createSeedState,
  type BoardRepository,
} from './features/core/board-model'
import { useAppContext } from './features/core/use-app-context'
import { renderAppWithDemo, renderWithRepository } from './test/helpers'

function createPendingRepository(): BoardRepository {
  return {
    mode: 'demo',
    initialize: () => new Promise(() => undefined),
    signIn: vi.fn(async () => ({ ok: false as const, message: 'pending' })),
    signOut: vi.fn(async () => undefined),
    createTask: vi.fn(async () => undefined),
    updateTask: vi.fn(async () => undefined),
    addComment: vi.fn(async () => undefined),
  }
}

describe('app routes', () => {
  it('shows sign-in and signs in with demo account', async () => {
    const user = userEvent.setup()
    renderAppWithDemo({ initialEntries: ['/signin'] })

    expect(await screen.findByRole('heading', { name: 'サインイン' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'サインイン' }))

    expect(await screen.findByRole('heading', { name: /Admin User さんの作業状況/ })).toBeInTheDocument()
    expect(screen.getByText('demo mode')).toBeInTheDocument()
  })

  it('redirects signed-in users away from /signin and allows sign-out', async () => {
    const user = userEvent.setup()
    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      initialEntries: ['/signin'],
    })

    expect(await screen.findByRole('heading', { name: /Admin User さんの作業状況/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'サインアウト' }))
    expect(await screen.findByRole('heading', { name: 'サインイン' })).toBeInTheDocument()
  })

  it('creates a task from the editor page and shows validation errors', async () => {
    const user = userEvent.setup()
    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      initialEntries: ['/tasks/new'],
    })

    expect(await screen.findByRole('heading', { name: '新しいタスクを作成' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'タスクを作成する' }))
    expect(await screen.findByText('タイトルを入力してください。')).toBeInTheDocument()

    await user.type(screen.getByLabelText('タイトル'), 'E2E に備えた画面確認をする')
    await user.type(screen.getByLabelText('説明'), 'Playwright 前に UI 導線を確認する')
    await user.selectOptions(screen.getByLabelText('担当者'), ADMIN_ACCOUNT.id)
    await user.click(screen.getByRole('button', { name: 'タスクを作成する' }))

    expect(await screen.findByRole('heading', { name: 'タスク一覧' })).toBeInTheDocument()
    expect(screen.getByText('E2E に備えた画面確認をする')).toBeInTheDocument()
  })

  it('edits a task and adds a comment on the detail page', async () => {
    const user = userEvent.setup()
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    const taskId = state.tasks[0]!.id

    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      state,
      initialEntries: [`/tasks/${taskId}/edit`],
    })

    expect(await screen.findByRole('heading', { name: 'タスクを編集' })).toBeInTheDocument()
    const titleInput = screen.getByLabelText('タイトル')
    await user.clear(titleInput)
    await user.type(titleInput, '編集済みタスク')
    await user.click(screen.getByRole('button', { name: '変更を保存する' }))

    expect(await screen.findByRole('heading', { name: '編集済みタスク' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('コメントを追加'), '詳細画面からの投稿テスト')
    await user.click(screen.getByRole('button', { name: 'コメントを投稿' }))

    expect(await screen.findByText('コメントを投稿しました。')).toBeInTheDocument()
    expect(screen.getByText('詳細画面からの投稿テスト')).toBeInTheDocument()
  })

  it('shows settings for admin and redirects normal users', async () => {
    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      initialEntries: ['/settings'],
    })

    expect(await screen.findByRole('heading', { name: '管理ビュー' })).toBeInTheDocument()
    expect(screen.getByText('OpenAPI contract')).toBeInTheDocument()

    cleanup()
    renderAppWithDemo({
      signedInUserId: USER_ONE_ACCOUNT.id,
      initialEntries: ['/settings'],
    })

    expect(await screen.findByRole('heading', { name: /User One さんの作業状況/ })).toBeInTheDocument()
  })

  it('shows empty state and missing pages where appropriate', async () => {
    const emptyState = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    emptyState.tasks = []
    emptyState.comments = []

    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      state: emptyState,
      initialEntries: ['/tasks'],
    })

    expect(await screen.findByText('タスクがありません')).toBeInTheDocument()

    cleanup()
    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      initialEntries: ['/tasks/missing'],
    })
    expect(await screen.findByText('タスクが見つかりません')).toBeInTheDocument()

    cleanup()
    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      initialEntries: ['/not-found'],
    })
    expect(await screen.findByText('ページが見つかりません')).toBeInTheDocument()
  })

  it('shows loading states while repository is pending', async () => {
    renderWithRepository(<AppRoutes />, {
      repository: createPendingRepository(),
      routerProps: { initialEntries: ['/signin'] },
    })
    expect(screen.getByText('読み込み中です...')).toBeInTheDocument()

    cleanup()
    renderWithRepository(<AppRoutes />, {
      repository: createPendingRepository(),
      routerProps: { initialEntries: ['/dashboard'] },
    })
    expect(screen.getByText('読み込み中です...')).toBeInTheDocument()

    cleanup()
    renderWithRepository(<AppRoutes />, {
      repository: createPendingRepository(),
      routerProps: { initialEntries: ['/'] },
    })
    expect(screen.getByText('読み込み中です...')).toBeInTheDocument()
  })

  it('redirects from root based on authentication state', async () => {
    renderAppWithDemo({ initialEntries: ['/'] })
    expect(await screen.findByRole('heading', { name: 'サインイン' })).toBeInTheDocument()

    cleanup()
    renderAppWithDemo({
      signedInUserId: ADMIN_ACCOUNT.id,
      initialEntries: ['/'],
    })

    expect(await screen.findByRole('heading', { name: /Admin User さんの作業状況/ })).toBeInTheDocument()
  })
})

describe('supporting components and hooks', () => {
  it('renders empty state directly', () => {
    render(<EmptyState title="空です" description="説明です" action={<button type="button">追加</button>} />)
    expect(screen.getByText('空です')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
  })

  it('renders empty state without action', () => {
    render(<EmptyState title="空です" description="説明だけです" />)
    expect(screen.getByText('説明だけです')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('throws when useAppContext is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    function Broken() {
      useAppContext()
      return null
    }

    expect(() => render(<Broken />)).toThrow('useAppContext は AppProvider の内側で使用してください。')
    consoleSpy.mockRestore()
  })

  it('allows consumers to read from AppContext directly', async () => {
    function Consumer() {
      const context = useAppContext()
      return <span>{context.repositoryMode}</span>
    }

    const repository = {
      mode: 'demo' as const,
      initialize: async () => ({ state: createSeedState(new Date('2026-04-04T00:00:00.000Z')), currentUserId: ADMIN_ACCOUNT.id }),
      signIn: vi.fn(async () => ({ ok: true as const, userId: ADMIN_ACCOUNT.id })),
      signOut: vi.fn(async () => undefined),
      createTask: vi.fn(async () => undefined),
      updateTask: vi.fn(async () => undefined),
      addComment: vi.fn(async () => undefined),
    }

    render(
      <MemoryRouter>
        <AppProvider repository={repository}>
          <Consumer />
        </AppProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('demo')).toBeInTheDocument())
  })

  it('supports direct AppContext provider usage', () => {
    render(
      <AppContext.Provider
        value={{
          repositoryMode: 'demo',
          isLoading: false,
          currentUser: null,
          users: [],
          tasks: [],
          labels: [],
          summary: null,
          signIn: vi.fn(async () => ({ ok: true as const })),
          signOut: vi.fn(async () => undefined),
          createTask: vi.fn(async () => ({ ok: true as const })),
          updateTask: vi.fn(async () => ({ ok: true as const })),
          addComment: vi.fn(async () => ({ ok: true as const })),
          getTask: vi.fn(),
        }}
      >
        <span>provider works</span>
      </AppContext.Provider>
    )

    expect(screen.getByText('provider works')).toBeInTheDocument()
  })
})
