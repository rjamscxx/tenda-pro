#!/usr/bin/env node
// Inserts a row into drizzle.__drizzle_migrations marking a generated drizzle
// migration as already-applied — without actually running its SQL. Used when
// the schema changes were applied out-of-band (e.g. hand-written supabase SQL)
// and we don't want db:migrate to try to re-create the same tables/columns.
//
// Run with: npx dotenv -e .env.local -- node scripts/mark-migration-applied.mjs <tag>
// Example:  npx dotenv -e .env.local -- node scripts/mark-migration-applied.mjs 0004_quiet_human_robot

import postgres from 'postgres'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const tag = process.argv[2]
if (!tag) {
  console.error('Usage: node scripts/mark-migration-applied.mjs <tag>')
  console.error('Example tag: 0004_quiet_human_robot')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations')
const sqlPath = path.join(MIGRATIONS_DIR, `${tag}.sql`)
const journalPath = path.join(MIGRATIONS_DIR, 'meta', '_journal.json')

const content = await readFile(sqlPath, 'utf8')
const hash = createHash('sha256').update(content).digest('hex')

const journal = JSON.parse(await readFile(journalPath, 'utf8'))
const entry = journal.entries.find(e => e.tag === tag)
if (!entry) {
  console.error(`Tag '${tag}' not in journal. Available:`, journal.entries.map(e => e.tag))
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

try {
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS drizzle`)
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)
  const existing = await sql`
    SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `
  if (existing.length) {
    console.log(`✓ ${tag} already marked applied (hash ${hash.slice(0, 12)}…)`)
  } else {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `
    console.log(`✓ Marked ${tag} as applied`)
    console.log(`  hash: ${hash}`)
    console.log(`  created_at: ${entry.when}`)
  }
} catch (err) {
  console.error('✗ Failed:', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await sql.end()
}
