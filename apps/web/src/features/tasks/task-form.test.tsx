import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ADMIN_ACCOUNT, USER_ONE_ACCOUNT, createSeedState } from '../core/board-model'
import { TaskForm } from './task-form'
import { DEFAULT_TASK_FORM_VALUES } from './task-form-defaults'

describe('TaskForm', () => {
  it('updates all fields, toggles labels, and shows returned errors', async () => {
    const user = userEvent.setup()
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: false,
        message: '保存できませんでした。',
        errors: {
          title: 'タイトルを確認してください。',
          description: '説明を確認してください。',
          status: 'ステータスを確認してください。',
          priority: '優先度を確認してください。',
          dueDate: '締切日を確認してください。',
          assigneeId: '担当者を確認してください。',
          labelIds: 'ラベルを確認してください。',
        },
      })

    render(
      <TaskForm
        initialValues={DEFAULT_TASK_FORM_VALUES}
        users={state.users}
        labels={state.labels}
        submitLabel="保存する"
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText('タイトル'), '新しい課題')
    await user.type(screen.getByLabelText('説明'), '課題の説明')
    await user.selectOptions(screen.getByLabelText('ステータス'), 'done')
    await user.selectOptions(screen.getByLabelText('優先度'), 'urgent')
    await user.type(screen.getByLabelText('締切日'), '2026-04-08')
    await user.selectOptions(screen.getByLabelText('担当者'), USER_ONE_ACCOUNT.id)

    const frontendLabel = screen.getByText('frontend')
    await user.click(frontendLabel)
    await user.click(frontendLabel)
    await user.click(screen.getByText('docs'))

    await user.click(screen.getByRole('button', { name: '保存する' }))
    expect(onSubmit).toHaveBeenNthCalledWith(1, {
      title: '新しい課題',
      description: '課題の説明',
      status: 'done',
      priority: 'urgent',
      dueDate: '2026-04-08',
      assigneeId: USER_ONE_ACCOUNT.id,
      labelIds: [state.labels[2]!.id],
    })
    expect(screen.getByText('入力内容を確認してください。')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('締切日'))
    await user.selectOptions(screen.getByLabelText('担当者'), '')
    await user.click(screen.getByRole('button', { name: '保存する' }))

    expect(onSubmit).toHaveBeenNthCalledWith(2, {
      title: '新しい課題',
      description: '課題の説明',
      status: 'done',
      priority: 'urgent',
      dueDate: null,
      assigneeId: null,
      labelIds: [state.labels[2]!.id],
    })
    expect(screen.getByText('保存できませんでした。')).toBeInTheDocument()
    expect(screen.getByText('タイトルを確認してください。')).toBeInTheDocument()
    expect(screen.getByText('説明を確認してください。')).toBeInTheDocument()
    expect(screen.getByText('ステータスを確認してください。')).toBeInTheDocument()
    expect(screen.getByText('優先度を確認してください。')).toBeInTheDocument()
    expect(screen.getByText('締切日を確認してください。')).toBeInTheDocument()
    expect(screen.getByText('担当者を確認してください。')).toBeInTheDocument()
    expect(screen.getByText('ラベルを確認してください。')).toBeInTheDocument()
  })

  it('resets values when initialValues change', () => {
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    const { rerender } = render(
      <TaskForm
        initialValues={DEFAULT_TASK_FORM_VALUES}
        users={state.users}
        labels={state.labels}
        submitLabel="保存する"
        onSubmit={vi.fn(async () => ({ ok: true }))}
      />
    )

    expect(screen.getByLabelText('タイトル')).toHaveValue('')

    rerender(
      <TaskForm
        initialValues={{
          title: '既存タスク',
          description: '説明',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2026-04-09',
          assigneeId: ADMIN_ACCOUNT.id,
          labelIds: [state.labels[0]!.id],
        }}
        users={state.users}
        labels={state.labels}
        submitLabel="保存する"
        onSubmit={vi.fn(async () => ({ ok: true }))}
      />
    )

    expect(screen.getByLabelText('タイトル')).toHaveValue('既存タスク')
    expect(screen.getByLabelText('ステータス')).toHaveValue('in_progress')
    expect(screen.getByLabelText('優先度')).toHaveValue('high')
    expect(screen.getByLabelText('締切日')).toHaveValue('2026-04-09')
    expect(screen.getByLabelText('担当者')).toHaveValue(ADMIN_ACCOUNT.id)
  })
})
