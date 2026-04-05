import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { useAppContext } from '../features/core/use-app-context'
import { DEFAULT_TASK_FORM_VALUES } from '../features/tasks/task-form-defaults'
import { TaskForm } from '../features/tasks/task-form'

export function TaskEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const { getTask, users, labels, createTask, updateTask } = useAppContext()
  const task = mode === 'edit' && taskId ? getTask(taskId) : undefined

  if (mode === 'edit' && !task) {
    return <Navigate to="/tasks" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">{mode === 'create' ? 'Create Task' : 'Edit Task'}</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">
          {mode === 'create' ? '新しいタスクを作成' : 'タスクを編集'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Zod で検証した値を repository に渡し、demo / api の両モードで同じ UI を再利用します。
        </p>
      </div>

      <TaskForm
        initialValues={
          task
            ? {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
                labelIds: task.labelIds,
              }
            : DEFAULT_TASK_FORM_VALUES
        }
        users={users}
        labels={labels}
        submitLabel={mode === 'create' ? 'タスクを作成する' : '変更を保存する'}
        onSubmit={async (values) => {
          const result =
            mode === 'create' ? await createTask(values) : await updateTask(task!.id, values)

          if (result.ok) {
            navigate(mode === 'create' ? '/tasks' : `/tasks/${task!.id}`, { replace: true })
            return result
          } else {
            return result
          }
        }}
      />
    </div>
  )
}
