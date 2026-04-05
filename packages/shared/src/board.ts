export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const USER_ROLES = ['user', 'admin'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type UserRole = (typeof USER_ROLES)[number]
export type RepositoryMode = 'demo' | 'api'

export interface DemoAccountGuide {
  id: string
  email: string
  name: string
  role: UserRole
  password: string
}

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AppLabel {
  id: string
  name: string
  color: string
}

export interface AppTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeId: string | null
  createdById: string
  labelIds: string[]
  createdAt: string
  updatedAt: string
}

export interface AppComment {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt: string
}

export interface BoardState {
  users: AppUser[]
  labels: AppLabel[]
  tasks: AppTask[]
  comments: AppComment[]
}

export interface CommentView extends AppComment {
  author: AppUser
}

export interface TaskView extends AppTask {
  assignee: AppUser | null
  createdBy: AppUser
  labels: AppLabel[]
  comments: CommentView[]
}

export interface DashboardSummary {
  assignedToMe: number
  statusCounts: Record<TaskStatus, number>
  dueSoon: TaskView[]
  recentlyUpdated: TaskView[]
}

export interface ContractSource {
  title: string
  path: string
  reason: string
}

export interface RepositorySnapshot {
  state: BoardState
  currentUserId: string | null
}

export interface RepositoryAuthResult {
  ok: true
  userId: string
}

export interface RepositoryAuthFailure {
  ok: false
  message: string
}

export type RepositoryAuthResponse = RepositoryAuthResult | RepositoryAuthFailure

export interface SignInValues {
  email: string
  password: string
}

export interface TaskFormValues {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeId: string | null
  labelIds: string[]
}

export interface CommentValues {
  content: string
}

export interface TaskLabelLink {
  taskId: string
  labelId: string
}

export interface BoardRepository {
  readonly mode: RepositoryMode
  initialize(): Promise<RepositorySnapshot>
  signIn(values: SignInValues): Promise<RepositoryAuthResponse>
  signOut(): Promise<void>
  createTask(currentUserId: string, values: TaskFormValues): Promise<void>
  updateTask(taskId: string, values: TaskFormValues): Promise<void>
  addComment(taskId: string, authorId: string, values: CommentValues): Promise<void>
}

export const DEMO_ACCOUNTS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    password: 'password123',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'user1@example.com',
    name: 'User One',
    role: 'user',
    password: 'password123',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'user2@example.com',
    name: 'User Two',
    role: 'user',
    password: 'password123',
  },
] as const satisfies readonly [DemoAccountGuide, DemoAccountGuide, DemoAccountGuide]

export const [ADMIN_ACCOUNT, USER_ONE_ACCOUNT, USER_TWO_ACCOUNT] = DEMO_ACCOUNTS

export const CONTRACT_SOURCES: ContractSource[] = [
  {
    title: 'OpenAPI contract',
    path: 'docs/api/openapi.yaml',
    reason: 'SPA と API の境界でやり取りする JSON 契約の正本です。',
  },
  {
    title: 'Prisma schema',
    path: 'apps/api/prisma/schema.prisma',
    reason: 'テーブル構造・関連・制約を保持する永続化モデルの正本です。',
  },
  {
    title: 'Auth guide',
    path: 'docs/auth.md',
    reason: 'セッション Cookie、認証境界、未認証制御の意図を人間向けに補足します。',
  },
  {
    title: 'Deployment guide',
    path: 'docs/deployment.md',
    reason: 'SPA と API を分離して無料枠運用する前提をまとめた補足資料です。',
  },
]

const LABELS = [
  { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'frontend', color: '#38bdf8' },
  { id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', name: 'backend', color: '#a78bfa' },
  { id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'docs', color: '#f59e0b' },
  { id: 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', name: 'review', color: '#34d399' },
  { id: 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', name: 'bugfix', color: '#fb7185' },
] as const satisfies readonly [AppLabel, AppLabel, AppLabel, AppLabel, AppLabel]

const [FRONTEND_LABEL, BACKEND_LABEL, DOCS_LABEL, REVIEW_LABEL, BUGFIX_LABEL] = LABELS

const TASK_BLUEPRINTS: Array<{
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueInDays: number | null
  assigneeId: string | null
  createdById: string
  labelIds: string[]
  createdAtOffsetHours: number
  updatedAtOffsetHours: number
}> = [
  {
    id: '44444444-4444-4444-8444-444444444441',
    title: 'ダッシュボードの担当件数カードを作る',
    description: '自分の担当タスク数をトップで確認できるようにする。',
    status: 'in_progress',
    priority: 'high',
    dueInDays: 2,
    assigneeId: USER_ONE_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [FRONTEND_LABEL.id],
    createdAtOffsetHours: -120,
    updatedAtOffsetHours: -6,
  },
  {
    id: '44444444-4444-4444-8444-444444444442',
    title: 'OpenAPI と Prisma の差分を確認する',
    description: 'docs/api/openapi.yaml と schema.prisma を見比べ、契約と永続化の境界を説明できるようにする。',
    status: 'todo',
    priority: 'medium',
    dueInDays: 5,
    assigneeId: USER_TWO_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [DOCS_LABEL.id, REVIEW_LABEL.id],
    createdAtOffsetHours: -96,
    updatedAtOffsetHours: -20,
  },
  {
    id: '44444444-4444-4444-8444-444444444443',
    title: 'サインイン画面に開発用アカウントを載せる',
    description: '初学者が迷わないよう demo モード用アカウントを表示する。',
    status: 'done',
    priority: 'low',
    dueInDays: -1,
    assigneeId: ADMIN_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [FRONTEND_LABEL.id, DOCS_LABEL.id],
    createdAtOffsetHours: -168,
    updatedAtOffsetHours: -48,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    title: 'コメント投稿フォームを接続する',
    description: 'タスク詳細からコメントを投稿し、更新日時を追えるようにする。',
    status: 'in_review',
    priority: 'urgent',
    dueInDays: 1,
    assigneeId: USER_ONE_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [BACKEND_LABEL.id, BUGFIX_LABEL.id],
    createdAtOffsetHours: -60,
    updatedAtOffsetHours: -3,
  },
  {
    id: '44444444-4444-4444-8444-444444444445',
    title: 'タスク一覧に優先度バッジを出す',
    description: '優先度を色で区別し、一覧性を高める。',
    status: 'todo',
    priority: 'medium',
    dueInDays: 7,
    assigneeId: null,
    createdById: USER_ONE_ACCOUNT.id,
    labelIds: [FRONTEND_LABEL.id],
    createdAtOffsetHours: -36,
    updatedAtOffsetHours: -12,
  },
  {
    id: '44444444-4444-4444-8444-444444444446',
    title: 'API の seed 手順を README から参照する',
    description: 'apps/api/prisma/seed.ts の位置をセットアップ文書からたどれるようにする。',
    status: 'done',
    priority: 'low',
    dueInDays: null,
    assigneeId: USER_TWO_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [DOCS_LABEL.id],
    createdAtOffsetHours: -240,
    updatedAtOffsetHours: -72,
  },
  {
    id: '44444444-4444-4444-8444-444444444447',
    title: '設定画面に契約ファイル一覧を追加する',
    description: 'OpenAPI / Prisma schema / auth docs / deployment docs を確認できるようにする。',
    status: 'in_progress',
    priority: 'high',
    dueInDays: 3,
    assigneeId: ADMIN_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [DOCS_LABEL.id, REVIEW_LABEL.id],
    createdAtOffsetHours: -48,
    updatedAtOffsetHours: -2,
  },
  {
    id: '44444444-4444-4444-8444-444444444448',
    title: 'README の比較表を更新する',
    description: '標準構成との違いを README から追えるようにする。',
    status: 'todo',
    priority: 'medium',
    dueInDays: 6,
    assigneeId: USER_TWO_ACCOUNT.id,
    createdById: USER_ONE_ACCOUNT.id,
    labelIds: [DOCS_LABEL.id],
    createdAtOffsetHours: -22,
    updatedAtOffsetHours: -9,
  },
  {
    id: '44444444-4444-4444-8444-444444444449',
    title: '管理者だけが設定画面に入れるようにする',
    description: 'UI のガードと API 側の認可チェックの役割の違いを説明できるようにする。',
    status: 'in_review',
    priority: 'high',
    dueInDays: 4,
    assigneeId: ADMIN_ACCOUNT.id,
    createdById: ADMIN_ACCOUNT.id,
    labelIds: [BACKEND_LABEL.id, REVIEW_LABEL.id],
    createdAtOffsetHours: -50,
    updatedAtOffsetHours: -4,
  },
  {
    id: '44444444-4444-4444-8444-444444444450',
    title: 'タスク詳細にラベル一覧を表示する',
    description: '詳細画面だけでタスクの文脈を把握しやすくする。',
    status: 'done',
    priority: 'medium',
    dueInDays: 0,
    assigneeId: USER_ONE_ACCOUNT.id,
    createdById: USER_TWO_ACCOUNT.id,
    labelIds: [FRONTEND_LABEL.id, REVIEW_LABEL.id],
    createdAtOffsetHours: -80,
    updatedAtOffsetHours: -18,
  },
]

const COMMENT_BLUEPRINTS: Array<{
  id: string
  taskId: string
  authorId: string
  content: string
  createdAtOffsetHours: number
}> = [
  {
    id: '55555555-5555-4555-8555-555555555551',
    taskId: '44444444-4444-4444-8444-444444444441',
    authorId: ADMIN_ACCOUNT.id,
    content: 'まずは demo モードで流れを固めてから API 実接続に寄せましょう。',
    createdAtOffsetHours: -10,
  },
  {
    id: '55555555-5555-4555-8555-555555555552',
    taskId: '44444444-4444-4444-8444-444444444444',
    authorId: USER_ONE_ACCOUNT.id,
    content: 'コメント入力のバリデーションは Zod に集約しておきます。',
    createdAtOffsetHours: -5,
  },
  {
    id: '55555555-5555-4555-8555-555555555553',
    taskId: '44444444-4444-4444-8444-444444444447',
    authorId: USER_TWO_ACCOUNT.id,
    content: '契約ファイル一覧は settings で見えるようにすると説明しやすいです。',
    createdAtOffsetHours: -1,
  },
]

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function createSeedState(baseDate = new Date()): BoardState {
  const users = DEMO_ACCOUNTS.map((account) => ({
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
  }))
  const labels = LABELS.map((label) => ({ ...label }))
  const tasks = TASK_BLUEPRINTS.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueInDays === null ? null : toDateOnly(addDays(baseDate, task.dueInDays)),
    assigneeId: task.assigneeId,
    createdById: task.createdById,
    labelIds: [...task.labelIds],
    createdAt: addHours(baseDate, task.createdAtOffsetHours).toISOString(),
    updatedAt: addHours(baseDate, task.updatedAtOffsetHours).toISOString(),
  }))
  const comments = COMMENT_BLUEPRINTS.map((comment) => ({
    id: comment.id,
    taskId: comment.taskId,
    authorId: comment.authorId,
    content: comment.content,
    createdAt: addHours(baseDate, comment.createdAtOffsetHours).toISOString(),
  }))

  return { users, labels, tasks, comments }
}

export function cloneBoardState(state: BoardState): BoardState {
  return JSON.parse(JSON.stringify(state)) as BoardState
}

export function findUser(state: BoardState, userId: string): AppUser {
  const user = state.users.find((candidate) => candidate.id === userId)

  if (!user) {
    throw new Error('ユーザーが見つかりません。seed と参照整合を確認してください。')
  }

  return user
}

export function createTaskView(state: BoardState, task: AppTask): TaskView {
  return {
    ...task,
    assignee: task.assigneeId ? findUser(state, task.assigneeId) : null,
    createdBy: findUser(state, task.createdById),
    labels: state.labels.filter((label) => task.labelIds.includes(label.id)),
    comments: state.comments
      .filter((comment) => comment.taskId === task.id)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((comment) => ({
        ...comment,
        author: findUser(state, comment.authorId),
      })),
  }
}

export function createTaskViews(state: BoardState): TaskView[] {
  return [...state.tasks]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((task) => createTaskView(state, task))
}

export function createBoardStateFromRelations(input: {
  users: AppUser[]
  labels: AppLabel[]
  tasks: Omit<AppTask, 'labelIds'>[]
  comments: AppComment[]
  taskLabels: TaskLabelLink[]
}): BoardState {
  return {
    users: input.users,
    labels: input.labels,
    comments: input.comments,
    tasks: input.tasks.map((task) => ({
      ...task,
      labelIds: input.taskLabels
        .filter((taskLabel) => taskLabel.taskId === task.id)
        .map((taskLabel) => taskLabel.labelId),
    })),
  }
}

export function buildDashboardSummary(state: BoardState, currentUserId: string): DashboardSummary {
  const views = createTaskViews(state)
  const today = new Date().toISOString().slice(0, 10)
  const dueSoon = views.filter(
    (task): task is TaskView & { dueDate: string } => {
      if (!task.dueDate) {
        return false
      }

      return task.dueDate >= today && task.status !== 'done'
    }
  )

  return {
    assignedToMe: views.filter((task) => task.assigneeId === currentUserId).length,
    statusCounts: {
      todo: views.filter((task) => task.status === 'todo').length,
      in_progress: views.filter((task) => task.status === 'in_progress').length,
      in_review: views.filter((task) => task.status === 'in_review').length,
      done: views.filter((task) => task.status === 'done').length,
    },
    dueSoon: dueSoon.sort((left, right) => left.dueDate.localeCompare(right.dueDate)).slice(0, 3),
    recentlyUpdated: views.slice(0, 4),
  }
}

function uniqueLabelIds(labelIds: string[]): string[] {
  return [...new Set(labelIds)]
}

export function applyCreateTask(
  state: BoardState,
  currentUserId: string,
  values: TaskFormValues,
  now = new Date()
): BoardState {
  const newTask: AppTask = {
    id: crypto.randomUUID(),
    title: values.title,
    description: values.description,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate,
    assigneeId: values.assigneeId,
    createdById: currentUserId,
    labelIds: uniqueLabelIds(values.labelIds),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  return {
    ...state,
    tasks: [newTask, ...state.tasks],
  }
}

export function applyUpdateTask(
  state: BoardState,
  taskId: string,
  values: TaskFormValues,
  now = new Date()
): BoardState {
  const target = state.tasks.find((task) => task.id === taskId)

  if (!target) {
    throw new Error('更新対象のタスクが見つかりません。')
  }

  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            dueDate: values.dueDate,
            assigneeId: values.assigneeId,
            labelIds: uniqueLabelIds(values.labelIds),
            updatedAt: now.toISOString(),
          }
        : task
    ),
  }
}

export function applyCreateComment(
  state: BoardState,
  taskId: string,
  authorId: string,
  values: CommentValues,
  now = new Date()
): BoardState {
  const task = state.tasks.find((candidate) => candidate.id === taskId)

  if (!task) {
    throw new Error('コメント対象のタスクが見つかりません。')
  }

  const newComment: AppComment = {
    id: crypto.randomUUID(),
    taskId,
    authorId,
    content: values.content,
    createdAt: now.toISOString(),
  }

  return {
    ...state,
    tasks: state.tasks.map((candidate) =>
      candidate.id === taskId
        ? {
            ...candidate,
            updatedAt: now.toISOString(),
          }
        : candidate
    ),
    comments: [...state.comments, newComment],
  }
}

export function formatStatus(status: TaskStatus): string {
  return {
    todo: 'TODO',
    in_progress: '進行中',
    in_review: 'レビュー中',
    done: '完了',
  }[status]
}

export function formatPriority(priority: TaskPriority): string {
  return {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急',
  }[priority]
}
