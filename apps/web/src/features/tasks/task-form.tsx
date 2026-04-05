import { useEffect, useState } from 'react'

import { formatPriority, formatStatus, type AppLabel, type AppUser, type TaskFormValues } from '../core/board-model'

interface SubmitResult {
  ok: boolean
  message?: string
  errors?: Record<string, string>
}

export function TaskForm({
  initialValues,
  users,
  labels,
  submitLabel,
  onSubmit,
}: {
  initialValues: TaskFormValues
  users: AppUser[]
  labels: AppLabel[]
  submitLabel: string
  onSubmit(values: TaskFormValues): Promise<SubmitResult>
}) {
  const [values, setValues] = useState<TaskFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleLabelToggle = (labelId: string) => {
    setValues((current) => ({
      ...current,
      labelIds: current.labelIds.includes(labelId)
        ? current.labelIds.filter((id) => id !== labelId)
        : [...current.labelIds, labelId],
    }))
  }

  return (
    <form
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        setMessage(null)
        setErrors({})
        const result = await onSubmit(values)
        setIsSubmitting(false)

        if (!result.ok) {
          setErrors(result.errors ?? {})
          setMessage(result.message ?? '入力内容を確認してください。')
        }
      }}
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-0 focus:border-slate-500"
        />
        {errors.title ? <p className="text-sm text-rose-600">{errors.title}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="description">
          説明
        </label>
        <textarea
          id="description"
          rows={5}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-0 focus:border-slate-500"
        />
        {errors.description ? <p className="text-sm text-rose-600">{errors.description}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="status">
            ステータス
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status: event.target.value as TaskFormValues['status'],
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            {(['todo', 'in_progress', 'in_review', 'done'] as const).map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
          {errors.status ? <p className="text-sm text-rose-600">{errors.status}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="priority">
            優先度
          </label>
          <select
            id="priority"
            value={values.priority}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priority: event.target.value as TaskFormValues['priority'],
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
              <option key={priority} value={priority}>
                {formatPriority(priority)}
              </option>
            ))}
          </select>
          {errors.priority ? <p className="text-sm text-rose-600">{errors.priority}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="dueDate">
            締切日
          </label>
          <input
            id="dueDate"
            type="date"
            value={values.dueDate ?? ''}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                dueDate: event.target.value || null,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm"
          />
          {errors.dueDate ? <p className="text-sm text-rose-600">{errors.dueDate}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="assigneeId">
          担当者
        </label>
        <select
          id="assigneeId"
          value={values.assigneeId ?? ''}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              assigneeId: event.target.value || null,
            }))
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">未割り当て</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
        {errors.assigneeId ? <p className="text-sm text-rose-600">{errors.assigneeId}</p> : null}
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-slate-700">ラベル</span>
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => {
            const checked = values.labelIds.includes(label.id)
            return (
              <label
                key={label.id}
                className={[
                  'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm',
                  checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => handleLabelToggle(label.id)}
                />
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </label>
            )
          })}
        </div>
        {errors.labelIds ? <p className="text-sm text-rose-600">{errors.labelIds}</p> : null}
      </div>

      {message ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p> : null}

      <button
        type="submit"
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? '保存中...' : submitLabel}
      </button>
    </form>
  )
}
