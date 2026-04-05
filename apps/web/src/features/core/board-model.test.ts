import { describe, expect, it, vi } from 'vitest'

import {
  ADMIN_ACCOUNT,
  USER_ONE_ACCOUNT,
  applyCreateComment,
  applyCreateTask,
  applyUpdateTask,
  buildDashboardSummary,
  cloneBoardState,
  createBoardStateFromRelations,
  createSeedState,
  createTaskView,
  createTaskViews,
  findUser,
  formatPriority,
  formatStatus,
} from './board-model'

describe('board-model', () => {
  it('creates seed state and derived task views', () => {
    vi.setSystemTime(new Date('2026-04-04T00:00:00.000Z'))
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))

    expect(state.users).toHaveLength(3)
    expect(state.labels).toHaveLength(5)
    expect(state.tasks).toHaveLength(10)
    expect(state.comments).toHaveLength(3)

    const task = state.tasks[0]
    expect(task).toBeDefined()
    expect(cloneBoardState(state)).toEqual(state)

    const taskView = createTaskView(state, task!)
    expect(taskView.createdBy.id).toBe(task!.createdById)
    expect(taskView.labels.length).toBeGreaterThan(0)

    const views = createTaskViews(state)
    expect(views[0]).toBeDefined()
    expect(views[1]).toBeDefined()
    expect(views[0]!.updatedAt >= views[1]!.updatedAt).toBe(true)

    const summary = buildDashboardSummary(state, USER_ONE_ACCOUNT.id)
    expect(summary.assignedToMe).toBeGreaterThan(0)
    expect(summary.statusCounts.todo).toBeGreaterThan(0)
    expect(summary.dueSoon.length).toBeGreaterThan(0)
    expect(summary.recentlyUpdated.length).toBe(4)
  })

  it('creates board state from task label relations', () => {
    const state = createBoardStateFromRelations({
      users: [{ id: ADMIN_ACCOUNT.id, email: ADMIN_ACCOUNT.email, name: ADMIN_ACCOUNT.name, role: ADMIN_ACCOUNT.role }],
      labels: [{ id: 'label-1', name: 'docs', color: '#fff' }],
      tasks: [
        {
          id: 'task-1',
          title: 'task',
          description: '',
          status: 'todo',
          priority: 'medium',
          dueDate: null,
          assigneeId: null,
          createdById: ADMIN_ACCOUNT.id,
          createdAt: '2026-04-04T00:00:00.000Z',
          updatedAt: '2026-04-04T00:00:00.000Z',
        },
      ],
      comments: [],
      taskLabels: [{ taskId: 'task-1', labelId: 'label-1' }],
    })

    expect(state.tasks[0]?.labelIds).toEqual(['label-1'])
  })

  it('applies task creation, update, and comment creation', () => {
    vi.setSystemTime(new Date('2026-04-04T00:00:00.000Z'))
    const baseState = createSeedState(new Date('2026-04-04T00:00:00.000Z'))
    const created = applyCreateTask(baseState, ADMIN_ACCOUNT.id, {
      title: '新規タスク',
      description: 'desc',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-04-08',
      assigneeId: USER_ONE_ACCOUNT.id,
      labelIds: [baseState.labels[0]!.id, baseState.labels[0]!.id],
    })

    expect(created.tasks[0]?.title).toBe('新規タスク')
    expect(created.tasks[0]?.labelIds).toHaveLength(1)

    const updated = applyUpdateTask(created, created.tasks[0]!.id, {
      title: '更新後',
      description: 'changed',
      status: 'done',
      priority: 'urgent',
      dueDate: null,
      assigneeId: null,
      labelIds: [],
    })

    expect(updated.tasks[0]).toMatchObject({
      title: '更新後',
      status: 'done',
      priority: 'urgent',
      dueDate: null,
      assigneeId: null,
    })

    const commented = applyCreateComment(updated, updated.tasks[0]!.id, ADMIN_ACCOUNT.id, {
      content: '完了しました',
    })

    expect(commented.comments.at(-1)?.content).toBe('完了しました')
    expect(commented.tasks[0]?.updatedAt).toBe(commented.comments.at(-1)?.createdAt)
  })

  it('throws when updating missing task or finding missing user', () => {
    const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))

    expect(() =>
      applyUpdateTask(state, 'missing', {
        title: 'x',
        description: '',
        status: 'todo',
        priority: 'low',
        dueDate: null,
        assigneeId: null,
        labelIds: [],
      })
    ).toThrow('更新対象のタスクが見つかりません。')

    expect(() => applyCreateComment(state, 'missing', ADMIN_ACCOUNT.id, { content: 'x' })).toThrow(
      'コメント対象のタスクが見つかりません。'
    )
    expect(() => findUser(state, 'missing')).toThrow('ユーザーが見つかりません。seed と参照整合を確認してください。')
  })

  it('formats status and priority labels', () => {
    expect(formatStatus('in_progress')).toBe('進行中')
    expect(formatPriority('urgent')).toBe('緊急')
  })
})
