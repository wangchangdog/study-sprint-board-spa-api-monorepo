import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import { commentSchema, formatZodErrors, signInSchema, taskFormSchema } from './validations'

describe('validations', () => {
  it('validates sign-in values', () => {
    expect(signInSchema.safeParse({ email: 'admin@example.com', password: 'password123' }).success).toBe(true)
    const result = signInSchema.safeParse({ email: '', password: 'short' })
    expect(result.success).toBe(false)
  })

  it('validates task form values with preprocessing', () => {
    const result = taskFormSchema.parse({
      title: 'Task',
      description: 'Desc',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      assigneeId: '',
      labelIds: [],
    })

    expect(result.dueDate).toBeNull()
    expect(result.assigneeId).toBeNull()

    expect(
      taskFormSchema.safeParse({
        title: '',
        description: 'x'.repeat(501),
        status: 'invalid',
        priority: 'bad',
        dueDate: '2026/04/04',
        assigneeId: 'bad-id',
        labelIds: ['bad-id'],
      }).success
    ).toBe(false)
  })

  it('validates comments and formats zod errors', () => {
    expect(commentSchema.safeParse({ content: 'コメントです' }).success).toBe(true)
    const parsed = commentSchema.safeParse({ content: '' })
    expect(parsed.success).toBe(false)

    const errors = formatZodErrors(
      new ZodError([
        { code: 'custom', message: 'フォームエラー', path: [], input: undefined },
        { code: 'custom', message: 'タイトルエラー', path: ['title'], input: undefined },
      ])
    )

    expect(errors).toEqual({ form: 'フォームエラー', title: 'タイトルエラー' })
  })
})
