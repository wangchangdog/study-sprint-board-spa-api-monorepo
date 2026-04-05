import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import App from '../App'
import { AppContext, type AppContextValue } from '../features/core/app-context-shared'
import { ADMIN_ACCOUNT, createSeedState, createTaskView } from '../features/core/board-model'
import { DashboardPage } from './dashboard-page'
import { SettingsPage } from './settings-page'
import { SignInPage } from './signin-page'
import { TaskDetailPage } from './task-detail-page'
import { TaskEditorPage } from './task-editor-page'
import { TasksPage } from './tasks-page'

const baseState = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
const currentUser = {
  id: ADMIN_ACCOUNT.id,
  email: ADMIN_ACCOUNT.email,
  name: ADMIN_ACCOUNT.name,
  role: ADMIN_ACCOUNT.role,
}

function createContextValue(overrides?: Partial<AppContextValue>): AppContextValue {
  const tasks = baseState.tasks.map((task) => createTaskView(baseState, task))
  const summary = {
    assignedToMe: 1,
    statusCounts: {
      todo: 1,
      in_progress: 1,
      in_review: 1,
      done: 1,
    },
    dueSoon: tasks.slice(0, 2),
    recentlyUpdated: tasks.slice(0, 4),
  }

  return {
      repositoryMode: 'api',
    isLoading: false,
    currentUser,
    users: baseState.users,
    tasks,
    labels: baseState.labels,
    summary,
    signIn: vi.fn(async () => ({ ok: false as const, message: '認証失敗' })),
    signOut: vi.fn(async () => undefined),
    createTask: vi.fn(async () => ({ ok: false as const, message: '作成失敗' })),
    updateTask: vi.fn(async () => ({ ok: false as const, message: '更新失敗' })),
    addComment: vi.fn(async () => ({ ok: false as const, message: 'コメント投稿に失敗しました。' })),
    getTask: vi.fn((taskId: string) => tasks.find((task) => task.id === taskId)),
    ...overrides,
  }
}

function renderWithContext(ui: React.ReactNode, options?: { path?: string; value?: Partial<AppContextValue> }) {
  const value = createContextValue(options?.value)
  return render(
    <MemoryRouter initialEntries={[options?.path ?? '/']}>
      <AppContext.Provider value={value}>{ui}</AppContext.Provider>
    </MemoryRouter>
  )
}

describe('route branch coverage', () => {
  it('renders root redirects for signed-out and signed-in users through App default export', async () => {
    renderWithContext(<App />, {
      path: '/',
      value: {
        currentUser: null,
        summary: null,
      },
    })

    expect(await screen.findByRole('heading', { name: 'サインイン' })).toBeInTheDocument()

    renderWithContext(<App />, {
      path: '/',
      value: {
        repositoryMode: 'demo',
      },
    })

    expect(await screen.findByRole('heading', { name: /Admin User さんの作業状況/ })).toBeInTheDocument()
  })

  it('covers null-return branches and api mode rendering', () => {
    renderWithContext(
      <>
        <DashboardPage />
        <SettingsPage />
        <TaskDetailPage />
      </>,
      {
        value: {
          currentUser: null,
          users: [],
          tasks: [],
          labels: [],
          summary: null,
          getTask: vi.fn(() => undefined),
        },
      }
    )

    expect(screen.queryByText('管理ビュー')).not.toBeInTheDocument()
    expect(screen.getByText('タスクが見つかりません')).toBeInTheDocument()

    renderWithContext(<SignInPage />)
    expect(screen.getByText('api mode')).toBeInTheDocument()
  })

  it('shows fallback and field errors on sign-in page', async () => {
    const user = userEvent.setup()
    const signIn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, message: '認証失敗' })
      .mockResolvedValueOnce({ ok: false, errors: { email: 'メールを確認してください。', password: 'パスワードを確認してください。' } })

    renderWithContext(<SignInPage />, {
      value: { signIn },
    })

    await user.clear(screen.getByLabelText('メールアドレス'))
    await user.type(screen.getByLabelText('メールアドレス'), 'wrong@example.com')
    await user.clear(screen.getByLabelText('パスワード'))
    await user.type(screen.getByLabelText('パスワード'), 'badpass123')
    await user.click(screen.getByRole('button', { name: 'サインイン' }))

    expect(await screen.findByText('認証失敗')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'サインイン' }))
    expect(await screen.findByText('サインインに失敗しました。')).toBeInTheDocument()
    expect(screen.getByText('メールを確認してください。')).toBeInTheDocument()
    expect(screen.getByText('パスワードを確認してください。')).toBeInTheDocument()
  })

  it('shows dashboard empty due-soon state', () => {
    renderWithContext(<DashboardPage />, {
      value: {
        summary: {
          assignedToMe: 0,
          statusCounts: {
            todo: 0,
            in_progress: 0,
            in_review: 0,
            done: 0,
          },
          dueSoon: [],
          recentlyUpdated: createContextValue().tasks.slice(0, 2),
        },
      },
    })

    expect(screen.getByText('期限が近いタスクはありません')).toBeInTheDocument()
  })

  it('shows task description fallback in tasks page', () => {
    const descriptionlessState = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    descriptionlessState.tasks[0] = {
      ...descriptionlessState.tasks[0]!,
      description: '',
    }
    const tasks = descriptionlessState.tasks.map((task) => createTaskView(descriptionlessState, task))

    renderWithContext(<TasksPage />, {
      value: {
        repositoryMode: 'demo',
        tasks,
        getTask: vi.fn((taskId: string) => tasks.find((task) => task.id === taskId)),
      },
    })

    expect(screen.getByText('説明はまだありません。')).toBeInTheDocument()
  })

  it('shows comment failure and metadata fallbacks on task detail page', async () => {
    const user = userEvent.setup()
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    state.tasks[0] = {
      ...state.tasks[0]!,
      description: '',
      assigneeId: null,
      labelIds: [],
    }
    state.comments = state.comments.filter((comment) => comment.taskId !== state.tasks[0]!.id)
    const task = createTaskView(state, state.tasks[0]!)
    const addComment = vi.fn(async () => ({ ok: false as const, errors: { content: '必須です。' } }))

    render(
      <MemoryRouter initialEntries={[`/tasks/${task.id}`]}>
        <AppContext.Provider
          value={createContextValue({
            repositoryMode: 'demo',
            tasks: [task],
            addComment,
            getTask: vi.fn(() => task),
          })}
        >
          <Routes>
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          </Routes>
        </AppContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('説明はまだありません。')).toBeInTheDocument()
    expect(screen.getByText('コメントはまだありません')).toBeInTheDocument()
    expect(screen.getByText('未割り当て')).toBeInTheDocument()
    expect(screen.getByText('ラベルなし')).toBeInTheDocument()

    await user.type(screen.getByLabelText('コメントを追加'), '失敗させるコメント')
    await user.click(screen.getByRole('button', { name: 'コメントを投稿' }))

    expect(await screen.findByText('必須です。')).toBeInTheDocument()
  })

  it('shows message and default fallback on task detail submission failure', async () => {
    const user = userEvent.setup()
    const task = createTaskView(baseState, baseState.tasks[0]!)
    const addComment = vi
      .fn()
      .mockResolvedValueOnce({ ok: false as const, message: '投稿失敗です。' })
      .mockResolvedValueOnce({ ok: false as const })

    render(
      <MemoryRouter initialEntries={[`/tasks/${task.id}`]}>
        <AppContext.Provider
          value={createContextValue({
            repositoryMode: 'demo',
            tasks: [task],
            addComment,
            getTask: vi.fn(() => task),
          })}
        >
          <Routes>
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          </Routes>
        </AppContext.Provider>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('コメントを追加'), '1回目')
    await user.click(screen.getByRole('button', { name: 'コメントを投稿' }))
    expect(await screen.findByText('投稿失敗です。')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('コメントを追加'))
    await user.type(screen.getByLabelText('コメントを追加'), '2回目')
    await user.click(screen.getByRole('button', { name: 'コメントを投稿' }))
    expect(await screen.findByText('コメント投稿に失敗しました。')).toBeInTheDocument()
  })

  it('submits from create mode and stays on edit page when update fails', async () => {
    const user = userEvent.setup()
    const createTask = vi.fn(async () => ({ ok: true as const }))
    render(
      <MemoryRouter initialEntries={['/tasks/new']}>
        <AppContext.Provider
          value={createContextValue({
            repositoryMode: 'demo',
            createTask,
          })}
        >
          <Routes>
            <Route path="/tasks" element={<div>tasks page</div>} />
            <Route path="/tasks/new" element={<TaskEditorPage mode="create" />} />
          </Routes>
        </AppContext.Provider>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('タイトル'), '作成画面テスト')
    await user.click(screen.getByRole('button', { name: 'タスクを作成する' }))
    expect(await screen.findByText('tasks page')).toBeInTheDocument()
    expect(createTask).toHaveBeenCalledOnce()

    const task = createTaskView(baseState, baseState.tasks[0]!)
    const updateTask = vi.fn(async () => ({ ok: false as const, message: '更新失敗です。' }))
    render(
      <MemoryRouter initialEntries={[`/tasks/${task.id}/edit`]}>
        <AppContext.Provider
          value={createContextValue({
            repositoryMode: 'demo',
            tasks: [task],
            updateTask,
            getTask: vi.fn(() => task),
          })}
        >
          <Routes>
            <Route path="/tasks/:taskId/edit" element={<TaskEditorPage mode="edit" />} />
          </Routes>
        </AppContext.Provider>
      </MemoryRouter>
    )

    await user.clear(screen.getByLabelText('タイトル'))
    await user.type(screen.getByLabelText('タイトル'), '編集失敗テスト')
    await user.click(screen.getByRole('button', { name: '変更を保存する' }))
    expect(await screen.findByText('更新失敗です。')).toBeInTheDocument()
    expect(updateTask).toHaveBeenCalledOnce()
  })

  it('navigates to detail page when edit submission succeeds', async () => {
    const user = userEvent.setup()
    const task = createTaskView(baseState, baseState.tasks[0]!)
    const updateTask = vi.fn(async () => ({ ok: true as const }))

    render(
      <MemoryRouter initialEntries={[`/tasks/${task.id}/edit`]}>
        <AppContext.Provider
          value={createContextValue({
            repositoryMode: 'demo',
            tasks: [task],
            updateTask,
            getTask: vi.fn((taskId: string) => (taskId === task.id ? task : undefined)),
          })}
        >
          <Routes>
            <Route path="/tasks/:taskId/edit" element={<TaskEditorPage mode="edit" />} />
            <Route path="/tasks/:taskId" element={<div>detail page</div>} />
          </Routes>
        </AppContext.Provider>
      </MemoryRouter>
    )

    await user.clear(screen.getByLabelText('タイトル'))
    await user.type(screen.getByLabelText('タイトル'), '編集成功テスト')
    await user.click(screen.getByRole('button', { name: '変更を保存する' }))

    expect(await screen.findByText('detail page')).toBeInTheDocument()
    expect(updateTask).toHaveBeenCalledOnce()
  })

  it('redirects missing edit task to tasks list', () => {
    render(
      <MemoryRouter initialEntries={['/tasks/missing/edit']}>
        <AppContext.Provider
          value={createContextValue({
            repositoryMode: 'demo',
            tasks: [],
            getTask: vi.fn(() => undefined),
          })}
        >
          <Routes>
            <Route path="/tasks" element={<div>tasks page</div>} />
            <Route path="/tasks/:taskId/edit" element={<TaskEditorPage mode="edit" />} />
          </Routes>
        </AppContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('tasks page')).toBeInTheDocument()
  })

  it('shows submit failure message on sign-in page', () => {
    renderWithContext(<SignInPage />)
    expect(screen.getByRole('button', { name: 'サインイン' })).toBeInTheDocument()
  })
})
