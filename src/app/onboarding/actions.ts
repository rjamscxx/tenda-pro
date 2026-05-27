'use server'

import { db } from '@/lib/db'
import { accounts, users, venues } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

interface CreateVenueInput {
  userId: string
  venueName: string
  fullName: string
}

export async function createVenue({ userId, venueName, fullName }: CreateVenueInput) {
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (existing.length > 0) redirect('/dashboard')

  try {
    const [account] = await db.insert(accounts).values({}).returning()
    await db.insert(users).values({
      id: userId,
      accountId: account.id,
      role: 'owner',
      fullName: fullName.trim() || null,
    })
    await db.insert(venues).values({
      accountId: account.id,
      name: venueName.trim(),
    })
  } catch (err) {
    console.error('createVenue error:', err)
    return { error: 'Something went wrong. Please try again.' }
  }

  redirect('/dashboard')
}
