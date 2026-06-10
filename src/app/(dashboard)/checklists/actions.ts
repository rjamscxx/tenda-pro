'use server'

import { db } from '@/lib/db'
import {
  checklistTemplates, checklistItems, checklistRuns, checklistRunItems,
} from '@/lib/db/schema'
import { and, asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireVenue } from '@/lib/queries/auth'
import { z } from 'zod'

type Kind = 'opening' | 'closing'

const DEFAULT_OPENING = [
  'Unlock store + turn on lights',
  'Power on POS, fridges, equipment',
  'Check fridge & freezer temperatures',
  'Count opening cash float',
  'Wipe down counters & menu boards',
  'Quick stock check (bread, ice, napkins)',
  'Brew first batch / prep mise-en-place',
]

const DEFAULT_CLOSING = [
  'Count cash drawer + reconcile vs POS',
  'Lock cash in safe / drop bag',
  'Wipe equipment + sanitize surfaces',
  'Empty trash + take out the bin',
  'Check fridge & freezer temps (one last time)',
  'Restock for tomorrow (cups, lids, etc.)',
  'Power down equipment + lock store',
]

/** Returns Manila-local YYYY-MM-DD without depending on the runtime TZ. */
function todayManila(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

/**
 * Read both templates + today's runs for the venue. Lazy-creates templates
 * with default items on first access so a brand-new venue lands on a useful
 * /checklists page without any extra setup.
 */
export async function getChecklistsState() {
  const { venue } = await requireVenue()

  const existing = await db.select({
    id: checklistTemplates.id, kind: checklistTemplates.kind, name: checklistTemplates.name,
  }).from(checklistTemplates).where(eq(checklistTemplates.venueId, venue.id))

  const seedDefaults = async (kind: Kind) => {
    const [row] = await db.insert(checklistTemplates).values({
      venueId: venue.id, kind, name: kind === 'opening' ? 'Opening checklist' : 'Closing checklist',
    }).returning({ id: checklistTemplates.id, kind: checklistTemplates.kind, name: checklistTemplates.name })
    const seed = kind === 'opening' ? DEFAULT_OPENING : DEFAULT_CLOSING
    await db.insert(checklistItems).values(
      seed.map((label, i) => ({ templateId: row.id, position: i, label })),
    )
    return row
  }

  let opening = existing.find(r => r.kind === 'opening')
  let closing = existing.find(r => r.kind === 'closing')
  if (!opening) opening = await seedDefaults('opening')
  if (!closing) closing = await seedDefaults('closing')

  const templateIds = [opening.id, closing.id]
  const items = await db.select({
    templateId: checklistItems.templateId,
    id:         checklistItems.id,
    position:   checklistItems.position,
    label:      checklistItems.label,
  })
    .from(checklistItems)
    .where(sql`${checklistItems.templateId} = ANY(${templateIds})`)
    .orderBy(asc(checklistItems.position))

  const today = todayManila()
  const runs = await db.select({
    id:          checklistRuns.id,
    templateId:  checklistRuns.templateId,
    kind:        checklistRuns.kind,
    runDate:     checklistRuns.runDate,
    startedAt:   checklistRuns.startedAt,
    completedAt: checklistRuns.completedAt,
  })
    .from(checklistRuns)
    .where(and(eq(checklistRuns.venueId, venue.id), eq(checklistRuns.runDate, today)))

  let runItems: { runId: string; id: string; position: number; label: string; checked: boolean; checkedAt: Date | null }[] = []
  if (runs.length > 0) {
    runItems = await db.select({
      runId:     checklistRunItems.runId,
      id:        checklistRunItems.id,
      position:  checklistRunItems.position,
      label:     checklistRunItems.label,
      checked:   checklistRunItems.checked,
      checkedAt: checklistRunItems.checkedAt,
    })
      .from(checklistRunItems)
      .where(sql`${checklistRunItems.runId} = ANY(${runs.map(r => r.id)})`)
      .orderBy(asc(checklistRunItems.position))
  }

  const templateFor = (kind: Kind) => kind === 'opening' ? opening! : closing!
  const itemsFor = (kind: Kind) =>
    items.filter(i => i.templateId === templateFor(kind).id)
      .map(i => ({ id: i.id, position: i.position, label: i.label }))
  const runFor = (kind: Kind) => {
    const r = runs.find(x => x.kind === kind)
    if (!r) return null
    const its = runItems.filter(x => x.runId === r.id).map(x => ({
      id: x.id, position: x.position, label: x.label, checked: x.checked,
      checkedAt: x.checkedAt ? x.checkedAt.toISOString() : null,
    }))
    return {
      id: r.id, templateId: r.templateId,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      items: its,
    }
  }

  return {
    today,
    opening: { template: templateFor('opening'), items: itemsFor('opening'), run: runFor('opening') },
    closing: { template: templateFor('closing'), items: itemsFor('closing'), run: runFor('closing') },
  }
}

/** Starts (or returns the existing) run for today + kind. */
export async function startRun(kind: Kind): Promise<{ runId?: string; error?: string }> {
  const { venue } = await requireVenue()
  const today = todayManila()

  const [existing] = await db.select({ id: checklistRuns.id })
    .from(checklistRuns)
    .where(and(eq(checklistRuns.venueId, venue.id), eq(checklistRuns.kind, kind), eq(checklistRuns.runDate, today)))
    .limit(1)
  if (existing) return { runId: existing.id }

  const [tpl] = await db.select({ id: checklistTemplates.id })
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.venueId, venue.id), eq(checklistTemplates.kind, kind)))
    .limit(1)
  if (!tpl) return { error: 'Template missing — refresh the page.' }

  const tplItems = await db.select({
    position: checklistItems.position,
    label:    checklistItems.label,
  })
    .from(checklistItems)
    .where(eq(checklistItems.templateId, tpl.id))
    .orderBy(asc(checklistItems.position))

  const [run] = await db.insert(checklistRuns).values({
    venueId: venue.id, templateId: tpl.id, kind, runDate: today,
  }).returning({ id: checklistRuns.id })

  if (tplItems.length > 0) {
    await db.insert(checklistRunItems).values(
      tplItems.map(it => ({ runId: run.id, position: it.position, label: it.label })),
    )
  }

  revalidatePath('/checklists')
  revalidatePath('/dashboard')
  return { runId: run.id }
}

const ToggleSchema = z.object({
  runItemId: z.string().uuid(),
  checked:   z.boolean(),
})

export async function toggleRunItem(input: { runItemId: string; checked: boolean }): Promise<{ error?: string }> {
  const parsed = ToggleSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input.' }
  const { dbUser, venue } = await requireVenue()

  // Ownership check: the run-item must belong to a run that belongs to this venue.
  const rows = await db.execute(sql`
    UPDATE checklist_run_items SET
      checked    = ${input.checked},
      checked_at = ${input.checked ? new Date() : null},
      checked_by = ${input.checked ? dbUser.id : null}
    WHERE id = ${input.runItemId}
      AND run_id IN (SELECT id FROM checklist_runs WHERE venue_id = ${venue.id})
    RETURNING id, run_id
  `)
  const updated = Array.isArray(rows) ? rows.length : (rows as { rowCount?: number }).rowCount ?? 0
  if (updated === 0) return { error: 'Item not found.' }

  // If every item on the run is now checked, mark run completed; if user unchecks
  // anything, the completedAt is cleared so the dashboard widget stays accurate.
  const runIdRow = (Array.isArray(rows) ? rows[0] : null) as { run_id?: string } | null
  if (runIdRow?.run_id) {
    await db.execute(sql`
      UPDATE checklist_runs SET
        completed_at = CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM checklist_run_items WHERE run_id = ${runIdRow.run_id} AND checked = false
          ) THEN now()
          ELSE NULL
        END,
        completed_by = CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM checklist_run_items WHERE run_id = ${runIdRow.run_id} AND checked = false
          ) THEN ${dbUser.id}
          ELSE NULL
        END
      WHERE id = ${runIdRow.run_id}
    `)
  }

  revalidatePath('/checklists')
  revalidatePath('/dashboard')
  return {}
}

// ─────────────────────────── Template editing ───────────────────────────────

const LabelSchema = z.string().trim().min(1, 'Label is required').max(160)

export async function addTemplateItem(templateId: string, label: string): Promise<{ error?: string }> {
  const parsedLabel = LabelSchema.safeParse(label)
  if (!parsedLabel.success) return { error: parsedLabel.error.issues[0]?.message ?? 'Invalid label.' }
  const { venue } = await requireVenue()

  const [tpl] = await db.select({ id: checklistTemplates.id })
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.id, templateId), eq(checklistTemplates.venueId, venue.id)))
    .limit(1)
  if (!tpl) return { error: 'Template not found.' }

  const [{ maxPos }] = await db.select({
    maxPos: sql<number>`coalesce(max(${checklistItems.position}), -1)`.mapWith(Number),
  })
    .from(checklistItems)
    .where(eq(checklistItems.templateId, templateId))

  await db.insert(checklistItems).values({
    templateId, position: maxPos + 1, label: parsedLabel.data,
  })

  await db.update(checklistTemplates).set({ updatedAt: new Date() }).where(eq(checklistTemplates.id, templateId))
  revalidatePath('/checklists')
  return {}
}

export async function updateTemplateItem(itemId: string, label: string): Promise<{ error?: string }> {
  const parsedLabel = LabelSchema.safeParse(label)
  if (!parsedLabel.success) return { error: parsedLabel.error.issues[0]?.message ?? 'Invalid label.' }
  const { venue } = await requireVenue()

  await db.execute(sql`
    UPDATE checklist_items SET label = ${parsedLabel.data}
    WHERE id = ${itemId}
      AND template_id IN (SELECT id FROM checklist_templates WHERE venue_id = ${venue.id})
  `)

  revalidatePath('/checklists')
  return {}
}

export async function deleteTemplateItem(itemId: string): Promise<{ error?: string }> {
  const { venue } = await requireVenue()
  await db.execute(sql`
    DELETE FROM checklist_items
    WHERE id = ${itemId}
      AND template_id IN (SELECT id FROM checklist_templates WHERE venue_id = ${venue.id})
  `)
  revalidatePath('/checklists')
  return {}
}

/** Today's checklist status for the dashboard widget. Cheap: 2 indexed reads. */
export async function getTodayChecklistSummary() {
  const { venue } = await requireVenue()
  const today = todayManila()

  const runs = await db.select({
    kind: checklistRuns.kind,
    id: checklistRuns.id,
    completedAt: checklistRuns.completedAt,
  })
    .from(checklistRuns)
    .where(and(eq(checklistRuns.venueId, venue.id), eq(checklistRuns.runDate, today)))

  if (runs.length === 0) {
    return { opening: { state: 'not-started' as const, done: 0, total: 0 },
             closing: { state: 'not-started' as const, done: 0, total: 0 } }
  }

  const runIds = runs.map(r => r.id)
  const counts = await db.execute<{ run_id: string; total: string; done: string }>(sql`
    SELECT run_id, count(*)::text AS total,
           count(*) filter (where checked) ::text AS done
    FROM checklist_run_items
    WHERE run_id = ANY(${runIds})
    GROUP BY run_id
  `)

  const get = (kind: Kind) => {
    const r = runs.find(x => x.kind === kind)
    if (!r) return { state: 'not-started' as const, done: 0, total: 0 }
    const c = (counts as unknown as { run_id: string; total: string; done: string }[]).find(x => x.run_id === r.id)
    const done = Number(c?.done ?? 0), total = Number(c?.total ?? 0)
    const state = r.completedAt ? 'done' as const : 'in-progress' as const
    return { state, done, total }
  }

  return { opening: get('opening'), closing: get('closing') }
}
