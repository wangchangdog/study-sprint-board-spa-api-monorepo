import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  buildDashboardSummary,
  createTaskViews,
  type BoardState,
  type CommentValues,
  type SignInValues,
  type TaskFormValues,
} from './board-model'
import {
  commentSchema,
  formatZodErrors,
  signInSchema,
  taskFormSchema,
} from '../../lib/validations'
import {
  AppContext,
  EMPTY_STATE,
  type ActionResult,
  type AppContextValue,
  type BoardRepository,
} from './app-context-shared'

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '予期しないエラーが発生しました。'
}

export function AppProvider({
  children,
  repository,
}: PropsWithChildren<{ repository: BoardRepository }>) {
  const [state, setState] = useState<BoardState>(EMPTY_STATE)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const snapshot = await repository.initialize()
    setState(snapshot.state)
    setCurrentUserId(snapshot.currentUserId)
  }, [repository])

  useEffect(() => {
    let mounted = true

    void (async () => {
      setIsLoading(true)
      const snapshot = await repository.initialize()

      if (mounted) {
        setState(snapshot.state)
        setCurrentUserId(snapshot.currentUserId)
        setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [repository])

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, state.users]
  )
  const tasks = useMemo(() => createTaskViews(state), [state])
  const summary = useMemo(
    () => (currentUser ? buildDashboardSummary(state, currentUser.id) : null),
    [currentUser, state]
  )

  const signIn = useCallback(
    async (values: SignInValues): Promise<ActionResult> => {
      const parsed = signInSchema.safeParse(values)

      if (!parsed.success) {
        return { ok: false, errors: formatZodErrors(parsed.error) }
      }

      try {
        const result = await repository.signIn(parsed.data)

        if (!result.ok) {
          return { ok: false, message: result.message }
        }

        await refresh()
        return { ok: true }
      } catch (error) {
        return { ok: false, message: toErrorMessage(error) }
      }
    },
    [refresh, repository]
  )

  const signOut = useCallback(async () => {
    await repository.signOut()
    await refresh()
  }, [refresh, repository])

  const createTask = useCallback(
    async (values: TaskFormValues): Promise<ActionResult> => {
      const parsed = taskFormSchema.safeParse(values)

      if (!parsed.success) {
        return { ok: false, errors: formatZodErrors(parsed.error) }
      }

      if (!currentUser) {
        return { ok: false, message: 'サインインが必要です。' }
      }

      try {
        await repository.createTask(currentUser.id, parsed.data)
        await refresh()
        return { ok: true }
      } catch (error) {
        return { ok: false, message: toErrorMessage(error) }
      }
    },
    [currentUser, refresh, repository]
  )

  const updateTask = useCallback(
    async (taskId: string, values: TaskFormValues): Promise<ActionResult> => {
      const parsed = taskFormSchema.safeParse(values)

      if (!parsed.success) {
        return { ok: false, errors: formatZodErrors(parsed.error) }
      }

      try {
        await repository.updateTask(taskId, parsed.data)
        await refresh()
        return { ok: true }
      } catch (error) {
        return { ok: false, message: toErrorMessage(error) }
      }
    },
    [refresh, repository]
  )

  const addComment = useCallback(
    async (taskId: string, values: CommentValues): Promise<ActionResult> => {
      const parsed = commentSchema.safeParse(values)

      if (!parsed.success) {
        return { ok: false, errors: formatZodErrors(parsed.error) }
      }

      if (!currentUser) {
        return { ok: false, message: 'サインインが必要です。' }
      }

      try {
        await repository.addComment(taskId, currentUser.id, parsed.data)
        await refresh()
        return { ok: true }
      } catch (error) {
        return { ok: false, message: toErrorMessage(error) }
      }
    },
    [currentUser, refresh, repository]
  )

  const value = useMemo<AppContextValue>(
    () => ({
      repositoryMode: repository.mode,
      isLoading,
      currentUser,
      users: state.users,
      tasks,
      labels: state.labels,
      summary,
      signIn,
      signOut,
      createTask,
      updateTask,
      addComment,
      getTask(taskId) {
        return tasks.find((task) => task.id === taskId)
      },
    }),
    [
      repository.mode,
      isLoading,
      currentUser,
      state.users,
      state.labels,
      tasks,
      summary,
      signIn,
      signOut,
      createTask,
      updateTask,
      addComment,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
