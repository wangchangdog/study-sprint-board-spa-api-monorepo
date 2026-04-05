import type {
  AppComment,
  AppLabel,
  AppTask,
  AppUser,
  CommentValues,
  TaskFormValues,
} from '@ssb/shared'

export interface AuthUserRecord extends AppUser {
  passwordHash: string
}

export interface SessionRecord {
  token: string
  user: AppUser
  expiresAt: Date
}

export interface TaskFilters {
  status?: AppTask['status']
  priority?: AppTask['priority']
  assigneeId?: string
}

export interface BoardStore {
  listUsers(): Promise<AppUser[]>
  listLabels(): Promise<AppLabel[]>
  listTasks(): Promise<AppTask[]>
  listComments(): Promise<AppComment[]>
  findUserByEmail(email: string): Promise<AuthUserRecord | null>
  findSession(token: string): Promise<SessionRecord | null>
  createSession(userId: string, token: string, expiresAt: Date): Promise<void>
  deleteSession(token: string): Promise<void>
  createTask(currentUserId: string, values: TaskFormValues): Promise<string>
  updateTask(taskId: string, values: TaskFormValues): Promise<void>
  addComment(taskId: string, authorId: string, values: CommentValues): Promise<string>
}
