import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('returns json body with status and time', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(typeof body.time).toBe('string')
  })

  it('time is a valid ISO date string', async () => {
    const res = await GET()
    const { time } = await res.json()
    expect(new Date(time).toISOString()).toBe(time)
  })
})
