import {
  applyCreateComment,
  applyCreateTask,
  applyUpdateTask,
  cloneBoardState,
  createSeedState,
  DEMO_ACCOUNTS,
  type BoardRepository,
  type BoardState,
  type CommentValues,
  type RepositoryAuthResponse,
  type RepositorySnapshot,
  type SignInValues,
  type TaskFormValues,
} from '../features/core/board-model'

export const BOARD_STATE_KEY = 'study-sprint-board-spa-api:demo-state'
export const SESSION_KEY = 'study-sprint-board-spa-api:session-user-id'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isBoardState(value: unknown): value is BoardState {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as BoardState
  return (
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.labels) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.comments)
  )
}

function cloneSnapshot(state: BoardState, currentUserId: string | null): RepositorySnapshot {
  return {
    state: cloneBoardState(state),
    currentUserId,
  }
}

export function loadBoardState(
  storage: StorageLike | undefined,
  fallbackDate: Date = new Date()
): BoardState {
  if (!storage) {
    return createSeedState(fallbackDate)
  }

  const raw = storage.getItem(BOARD_STATE_KEY)

  if (!raw) {
    return createSeedState(fallbackDate)
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return isBoardState(parsed) ? parsed : createSeedState(fallbackDate)
  } catch {
    return createSeedState(fallbackDate)
  }
}

export function loadCurrentUserId(storage: StorageLike | undefined): string | null {
  if (!storage) {
    return null
  }

  return storage.getItem(SESSION_KEY)
}

export function persistBoardState(storage: StorageLike | undefined, state: BoardState): void {
  storage?.setItem(BOARD_STATE_KEY, JSON.stringify(state))
}

export function persistCurrentUserId(
  storage: StorageLike | undefined,
  currentUserId: string | null
): void {
  if (!storage) {
    return
  }

  if (currentUserId) {
    storage.setItem(SESSION_KEY, currentUserId)
    return
  }

  storage.removeItem(SESSION_KEY)
}

export function createDemoRepository(options?: {
  storage?: StorageLike
  fallbackDate?: Date
}): BoardRepository {
  const storage = options?.storage
  const fallbackDate = options?.fallbackDate

  let state = loadBoardState(storage, fallbackDate)
  let currentUserId = loadCurrentUserId(storage)

  const syncState = (): void => {
    persistBoardState(storage, state)
    persistCurrentUserId(storage, currentUserId)
  }

  return {
    mode: 'demo',
    async initialize(): Promise<RepositorySnapshot> {
      return cloneSnapshot(state, currentUserId)
    },
    async signIn(values: SignInValues): Promise<RepositoryAuthResponse> {
      const account = DEMO_ACCOUNTS.find(
        (candidate) =>
          candidate.email.toLowerCase() === values.email.toLowerCase() &&
          candidate.password === values.password
      )

      if (!account) {
        return {
          ok: false,
          message: 'メールアドレスまたはパスワードが正しくありません。',
        }
      }

      currentUserId = account.id
      syncState()

      return {
        ok: true,
        userId: account.id,
      }
    },
    async signOut(): Promise<void> {
      currentUserId = null
      syncState()
    },
    async createTask(currentUserIdValue: string, values: TaskFormValues): Promise<void> {
      state = applyCreateTask(state, currentUserIdValue, values)
      syncState()
    },
    async updateTask(taskId: string, values: TaskFormValues): Promise<void> {
      state = applyUpdateTask(state, taskId, values)
      syncState()
    },
    async addComment(taskId: string, authorId: string, values: CommentValues): Promise<void> {
      state = applyCreateComment(state, taskId, authorId, values)
      syncState()
    },
  }
}
