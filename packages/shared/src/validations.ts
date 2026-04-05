import { z } from 'zod'

import { TASK_PRIORITIES, TASK_STATUSES } from './board'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function emptyToNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length === 0 ? null : normalized
}

export const signInSchema = z.object({
  email: z.string().trim().min(1, 'メールアドレスを入力してください。').email('メールアドレスの形式が不正です。'),
  password: z
    .string()
    .trim()
    .min(1, 'パスワードを入力してください。')
    .min(8, 'パスワードは8文字以上で入力してください。'),
})

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'タイトルを入力してください。')
    .max(100, 'タイトルは100文字以内で入力してください。'),
  description: z
    .string()
    .trim()
    .max(500, '説明は500文字以内で入力してください。'),
  status: z.enum(TASK_STATUSES, {
    error: 'ステータスを選択してください。',
  }),
  priority: z.enum(TASK_PRIORITIES, {
    error: '優先度を選択してください。',
  }),
  dueDate: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(datePattern, '締切日は YYYY-MM-DD 形式で入力してください。')
      .nullable()
  ),
  assigneeId: z.preprocess(
    emptyToNull,
    z.string().uuid('担当者の形式が不正です。').nullable()
  ),
  labelIds: z
    .array(z.string().uuid('ラベルの形式が不正です。'))
    .max(5, 'ラベルは5件まで選択できます。'),
})

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'コメントを入力してください。')
    .max(280, 'コメントは280文字以内で入力してください。'),
})

export type ValidationErrors = Record<string, string>

export function formatZodErrors(error: z.ZodError): ValidationErrors {
  return error.issues.reduce<ValidationErrors>((errors, issue) => {
    const key = issue.path.join('.') || 'form'

    if (!errors[key]) {
      errors[key] = issue.message
    }

    return errors
  }, {})
}
