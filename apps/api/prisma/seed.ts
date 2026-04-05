import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import type { TaskPriority, TaskStatus, UserRole } from '@prisma/client'
import { DEMO_ACCOUNTS, createSeedState } from '@ssb/shared'

const prisma = new PrismaClient()

function toDateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

async function main() {
  const state = createSeedState(new Date('2026-04-04T00:00:00.000Z'))

  await prisma.session.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.taskLabel.deleteMany()
  await prisma.task.deleteMany()
  await prisma.label.deleteMany()
  await prisma.user.deleteMany()

  const users = await Promise.all(
    DEMO_ACCOUNTS.map(async (account) =>
      prisma.user.create({
        data: {
          id: account.id,
          email: account.email.toLowerCase(),
          name: account.name,
          role: account.role as UserRole,
          passwordHash: await bcrypt.hash(account.password, 10),
        },
      })
    )
  )

  await prisma.label.createMany({
    data: state.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
  })

  for (const task of state.tasks) {
    await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        dueDate: toDateOnly(task.dueDate),
        assigneeId: task.assigneeId,
        createdById: task.createdById,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        taskLabels: {
          createMany: {
            data: task.labelIds.map((labelId) => ({
              labelId,
            })),
          },
        },
      },
    })
  }

  await prisma.comment.createMany({
    data: state.comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: new Date(comment.createdAt),
    })),
  })

  console.log(`Seeded ${users.length} users, ${state.tasks.length} tasks, and ${state.comments.length} comments.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
