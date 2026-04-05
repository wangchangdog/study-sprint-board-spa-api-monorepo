import type { TaskFormValues } from '../core/board-model'

export const DEFAULT_TASK_FORM_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  assigneeId: null,
  labelIds: [],
}
