import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCents, formatDate, cn } from './utils'

describe('formatCurrency', () => {
  it('formats whole pesos with PHP symbol', () => {
    // 10000 cents = ₱100
    expect(formatCurrency(10000)).toMatch(/₱\s*100/)
  })

  it('rounds fractional cents to nearest peso', () => {
    // 10050 cents = ₱100.50, rounds up to ₱101
    expect(formatCurrency(10050)).toMatch(/₱\s*101/)
  })

  it('formats zero as ₱0', () => {
    expect(formatCurrency(0)).toMatch(/₱\s*0/)
  })

  it('formats large amounts with comma separators', () => {
    // 1_000_000 cents = ₱10,000
    expect(formatCurrency(1_000_000)).toMatch(/10,000/)
  })

  it('accepts a custom currency', () => {
    expect(formatCurrency(10000, 'USD')).toMatch(/\$\s*100/)
  })
})

describe('parseCents', () => {
  it('converts a plain number string to cents', () => {
    expect(parseCents('100')).toBe(10000)
  })

  it('strips commas before parsing', () => {
    expect(parseCents('1,500')).toBe(150000)
  })

  it('handles decimal values (rounds to cents)', () => {
    expect(parseCents('99.99')).toBe(9999)
  })

  it('returns 0 for empty string', () => {
    expect(parseCents('')).toBe(0)
  })

  it('returns 0 for non-numeric string', () => {
    expect(parseCents('abc')).toBe(0)
  })

  it('handles negative values', () => {
    expect(parseCents('-50')).toBe(-5000)
  })
})

describe('formatDate', () => {
  it('formats a Date object to a readable string', () => {
    const d = new Date('2024-06-15T00:00:00Z')
    const result = formatDate(d)
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2024/)
  })

  it('accepts an ISO string', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })
})

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters out falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })

  it('returns empty string when all values are falsy', () => {
    expect(cn(false, undefined, null)).toBe('')
  })

  it('handles a single class', () => {
    expect(cn('only')).toBe('only')
  })
})
