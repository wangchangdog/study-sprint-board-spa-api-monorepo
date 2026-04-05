import {
  type AppComment,
  type AppLabel,
  type AppTask,
  type AppUser,
  type TaskFormValues,
} from '@ssb/shared'
import { Prisma } from '@prisma/client'

import { HttpError } from '../lib/errors'
import type { PrismaClient } from '@prisma/client'
import type { AuthUserRecord, BoardStore, SessionRecord } from './store'

function toUser(user: { id: string; email: string; name: string; role: AppUser['role'] }): AppUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null
}

function toTask(task: {
  id: string
  title: string
  description: string
  status: AppTask['status']
  priority: AppTask['priority']
  dueDate: Date | null
  assigneeId: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  taskLabels: Array<{ labelId: string }>
}): AppTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: toDateOnly(task.dueDate),
    assigneeId: task.assigneeId,
    createdById: task.createdById,
    labelIds: task.taskLabels.map((taskLabel) => taskLabel.labelId),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function toComment(comment: {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt: Date
}): AppComment {
  return {
    id: comment.id,
    taskId: comment.taskId,
    authorId: comment.authorId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  }
}

async function ensureRelations(prisma: PrismaClient, values: TaskFormValues) {
  if (values.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: values.assigneeId },
      select: { id: true },
    })

    if (!assignee) {
      throw new HttpError(400, '存在しない担当者が指定されています。')
    }
  }

  if (values.labelIds.length > 0) {
    const count = await prisma.label.count({
      where: {
        id: {
          in: values.labelIds,
        },
      },
    })

    if (count !== new Set(values.labelIds).size) {
      throw new HttpError(400, '存在しないラベルが含まれています。')
    }
  }
}

async function ensureTask(prisma: PrismaClient, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  })

  if (!task) {
    throw new HttpError(404, '対象のタスクが見つかりません。')
  }
}

export function createPrismaBoardStore(prisma: PrismaClient): BoardStore {
  return {
    async listUsers() {
      const users = await prisma.user.findMany({
        orderBy: {
          name: 'asc',
        },
      })

      return users.map(toUser)
    },
    async listLabels() {
      const labels = await prisma.label.findMany({
        orderBy: {
          name: 'asc',
        },
      })

      return labels.map<AppLabel>((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      }))
    },
    async listTasks() {
      const tasks = await prisma.task.findMany({
        include: {
          taskLabels: {
            select: {
              labelId: true,
            },
          },
        },
      })

      return tasks.map(toTask)
    },
    async listComments() {
      const comments = await prisma.comment.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      })

      return comments.map(toComment)
    },
    async findUserByEmail(email): Promise<AuthUserRecord | null> {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        return null
      }

      return {
        ...toUser(user),
        passwordHash: user.passwordHash,
      }
    },
    async findSession(token): Promise<SessionRecord | null> {
      const session = await prisma.session.findUnique({
        where: {
          token,
        },
        include: {
          user: true,
        },
      })

      if (!session) {
        return null
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        await prisma.session.deleteMany({
          where: { token },
        })
        return null
      }

      return {
        token: session.token,
        user: toUser(session.user),
        expiresAt: session.expiresAt,
      }
    },
    async createSession(userId, token, expiresAt) {
      await prisma.session.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      })
    },
    async deleteSession(token) {
      await prisma.session.deleteMany({
        where: { token },
      })
    },
    async createTask(currentUserId, values) {
      await ensureRelations(prisma, values)

      const task = await prisma.$transaction(async (transaction) => {
        const created = await transaction.task.create({
          data: {
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            dueDate: values.dueDate ? new Date(`${values.dueDate}T00:00:00.000Z`) : null,
            assigneeId: values.assigneeId,
            createdById: currentUserId,
          },
          select: {
            id: true,
          },
        })

        if (values.labelIds.length > 0) {
          await transaction.taskLabel.createMany({
            data: values.labelIds.map((labelId) => ({
              taskId: created.id,
              labelId,
            })),
          })
        }

        return created
      })

      return task.id
    },
    async updateTask(taskId, values) {
      await ensureTask(prisma, taskId)
      await ensureRelations(prisma, values)

      await prisma.$transaction(async (transaction) => {
        await transaction.task.update({
          where: {
            id: taskId,
          },
          data: {
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            dueDate: values.dueDate ? new Date(`${values.dueDate}T00:00:00.000Z`) : null,
            assigneeId: values.assigneeId,
          },
        })

        await transaction.taskLabel.deleteMany({
          where: {
            taskId,
          },
        })

        if (values.labelIds.length > 0) {
          await transaction.taskLabel.createMany({
            data: values.labelIds.map((labelId) => ({
              taskId,
              labelId,
            })),
          })
        }
      })
    },
    async addComment(taskId, authorId, values) {
      await ensureTask(prisma, taskId)

      try {
        const comment = await prisma.$transaction(async (transaction) => {
          const created = await transaction.comment.create({
            data: {
              taskId,
              authorId,
              content: values.content,
            },
            select: {
              id: true,
            },
          })

          await transaction.task.update({
            where: {
              id: taskId,
            },
            data: {
              updatedAt: new Date(),
            },
          })

          return created
        })

        return comment.id
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2003'
        ) {
          throw new HttpError(400, 'コメント作成に必要な参照先が見つかりません。')
        }

        throw error
      }
    },
  }
}
