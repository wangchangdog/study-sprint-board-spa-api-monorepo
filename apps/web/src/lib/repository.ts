import type { BoardRepository } from '../features/core/board-model'
import { createApiRepository } from './api-repository'
import { createDemoRepository } from './demo-repository'
import { env } from './env'

export function createAppRepository(): BoardRepository {
  if (env.enableApi) {
    return createApiRepository()
  }

  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  return createDemoRepository({ storage })
}
