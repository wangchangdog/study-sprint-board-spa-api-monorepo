import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalWindow = globalThis.window

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.doUnmock('./demo-repository')
  vi.doUnmock('./api-repository')
  vi.doUnmock('./env')
  globalThis.window = originalWindow
})

beforeEach(() => {
  globalThis.window = originalWindow
})

describe('createAppRepository', () => {
  it('returns demo repository when API mode is disabled', async () => {
    const demoRepository = { mode: 'demo' }
    const createDemoRepository = vi.fn(() => demoRepository)
    const createApiRepository = vi.fn()

    vi.doMock('./demo-repository', () => ({ createDemoRepository }))
    vi.doMock('./api-repository', () => ({ createApiRepository }))
    vi.doMock('./env', () => ({ env: { enableApi: false } }))

    const { createAppRepository } = await import('./repository')
    expect(createAppRepository()).toBe(demoRepository)
    expect(createDemoRepository).toHaveBeenCalledOnce()
    expect(createDemoRepository).toHaveBeenCalledWith({ storage: window.localStorage })
    expect(createApiRepository).not.toHaveBeenCalled()
  })

  it('passes undefined storage when window is unavailable', async () => {
    const demoRepository = { mode: 'demo' }
    const createDemoRepository = vi.fn(() => demoRepository)

    vi.doMock('./demo-repository', () => ({ createDemoRepository }))
    vi.doMock('./api-repository', () => ({ createApiRepository: vi.fn() }))
    vi.doMock('./env', () => ({ env: { enableApi: false } }))
    globalThis.window = undefined as unknown as Window & typeof globalThis

    const { createAppRepository } = await import('./repository')
    expect(createAppRepository()).toBe(demoRepository)
    expect(createDemoRepository).toHaveBeenCalledWith({ storage: undefined })
  })

  it('returns api repository when API mode is enabled', async () => {
    const apiRepository = { mode: 'api' }
    const createDemoRepository = vi.fn()
    const createApiRepository = vi.fn(() => apiRepository)

    vi.doMock('./demo-repository', () => ({ createDemoRepository }))
    vi.doMock('./api-repository', () => ({ createApiRepository }))
    vi.doMock('./env', () => ({ env: { enableApi: true } }))

    const { createAppRepository } = await import('./repository')
    expect(createAppRepository()).toBe(apiRepository)
    expect(createApiRepository).toHaveBeenCalledOnce()
    expect(createDemoRepository).not.toHaveBeenCalled()
  })
})
