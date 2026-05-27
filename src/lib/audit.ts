import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

export async function writeAudit(params: {
  venueId: string
  userId: string
  action: string
  tableName: string
  recordId: string
  oldData?: unknown
  newData?: unknown
}) {
  try {
    await db.insert(auditLogs).values({
      venueId:   params.venueId,
      userId:    params.userId,
      action:    params.action,
      tableName: params.tableName,
      recordId:  params.recordId,
      oldData:   params.oldData as Record<string, unknown> ?? null,
      newData:   params.newData as Record<string, unknown> ?? null,
    })
  } catch {
    // Audit log failures must not interrupt the main operation
  }
}
