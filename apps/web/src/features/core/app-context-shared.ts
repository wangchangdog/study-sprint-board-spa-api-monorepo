import { createContext } from 'react'

import type {
  AppUser,
  BoardRepository,
  BoardState,
  CommentValues,
  DashboardSummary,
  RepositoryMode,
  SignInValues,
  TaskFormValues,
  TaskView,
} from './board-model'
import type { ValidationErrors } from '../../lib/validations'

export interface ActionResult {
  ok: boolean
  message?: string
  errors?: ValidationErrors
}

export interface AppContextValue {
  repositoryMode: RepositoryMode
  isLoading: boolean
  currentUser: AppUser | null
  users: AppUser[]
  tasks: TaskView[]
  labels: BoardState['labels']
  summary: DashboardSummary | null
  signIn(values: SignInValues): Promise<ActionResult>
  signOut(): Promise<void>
  createTask(values: TaskFormValues): Promise<ActionResult>
  updateTask(taskId: string, values: TaskFormValues): Promise<ActionResult>
  addComment(taskId: string, values: CommentValues): Promise<ActionResult>
  getTask(taskId: string): TaskView | undefined
}

export const EMPTY_STATE: BoardState = {
  users: [],
  labels: [],
  tasks: [],
  comments: [],
}

export const AppContext = createContext<AppContextValue | undefined>(undefined)

export type { BoardRepository }
