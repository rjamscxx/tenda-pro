import { describe, it, expect } from 'vitest'
import { canSeeFinancials, isOwner } from './permissions'

describe('canSeeFinancials', () => {
  it('returns true for owner', () => {
    expect(canSeeFinancials({ role: 'owner' })).toBe(true)
  })

  it('returns false for staff', () => {
    expect(canSeeFinancials({ role: 'staff' })).toBe(false)
  })
})

describe('isOwner', () => {
  it('returns true for owner', () => {
    expect(isOwner({ role: 'owner' })).toBe(true)
  })

  it('returns false for staff', () => {
    expect(isOwner({ role: 'staff' })).toBe(false)
  })
})
