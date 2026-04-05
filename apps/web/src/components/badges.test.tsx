import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ModeBadge, PriorityBadge, StatusBadge } from './badges'

describe('badges', () => {
  it('renders status, priority, and both mode badges', () => {
    const { rerender } = render(
      <div>
        <StatusBadge status="done" />
        <PriorityBadge priority="urgent" />
        <ModeBadge mode="demo" />
      </div>
    )

    expect(screen.getByText('完了')).toBeInTheDocument()
    expect(screen.getByText('緊急')).toBeInTheDocument()
    expect(screen.getByText('demo mode')).toBeInTheDocument()

    rerender(<ModeBadge mode="api" />)
    expect(screen.getByText('api mode')).toBeInTheDocument()
  })
})
