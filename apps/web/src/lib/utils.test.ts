import { describe, expect, it } from 'vitest'

import { cn, formatDate } from './utils'

describe('utils', () => {
  it('joins class names and formats dates', () => {
    expect(cn('a', false, 'b', undefined, null)).toBe('a b')
    expect(formatDate(null)).toBe('未設定')
    expect(formatDate('2026-04-04T00:00:00.000Z')).toMatch(/2026/)
  })
})
