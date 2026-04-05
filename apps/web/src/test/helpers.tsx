import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'

import { AppRoutes } from '../App'
import { AppProvider } from '../features/core/app-context'
import { cloneBoardState, createSeedState, type BoardRepository, type BoardState } from '../features/core/board-model'
import {
  BOARD_STATE_KEY,
  createDemoRepository,
  SESSION_KEY,
  type StorageLike,
} from '../lib/demo-repository'

export function createMemoryStorage(initial?: Record<string, string>): StorageLike {
  const store = new Map(Object.entries(initial ?? {}))

  return {
    getItem(key) {
      return store.get(key) ?? null
    },
    setItem(key, value) {
      store.set(key, value)
    },
    removeItem(key) {
      store.delete(key)
    },
  }
}

export function createDemoRepositoryForTest(options?: {
  signedInUserId?: string | null
  state?: BoardState
  fallbackDate?: Date
}) {
  const fallbackDate = options?.fallbackDate ?? new Date('2026-04-04T00:00:00.000Z')
  const state = options?.state ?? createSeedState(fallbackDate)
  const storage = createMemoryStorage({
    [BOARD_STATE_KEY]: JSON.stringify(state),
    ...(options?.signedInUserId ? { [SESSION_KEY]: options.signedInUserId } : {}),
  })

  const repository = createDemoRepository({ storage, fallbackDate })
  return { repository, storage, state }
}

export function renderWithRepository(
  ui: ReactElement,
  options: {
    repository: BoardRepository
    routerProps?: MemoryRouterProps
  }
) {
  return render(
    <MemoryRouter {...options.routerProps}>
      <AppProvider repository={options.repository}>{ui}</AppProvider>
    </MemoryRouter>
  )
}

export function renderAppWithDemo(options?: {
  signedInUserId?: string | null
  state?: BoardState
  initialEntries?: MemoryRouterProps['initialEntries']
}) {
  const demo = createDemoRepositoryForTest({
    signedInUserId: options?.signedInUserId,
    state: options?.state ? cloneBoardState(options.state) : undefined,
  })

  return {
    ...demo,
    ...renderWithRepository(<AppRoutes />, {
      repository: demo.repository,
      routerProps: { initialEntries: options?.initialEntries ?? ['/'] },
    }),
  }
}
