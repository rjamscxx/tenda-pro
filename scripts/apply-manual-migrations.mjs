#!/usr/bin/env node
// Applies the SQL files in supabase/migrations-manual/ in lexicographic order.
//
// These hold RLS policies, raw Supabase tables (not in drizzle schema), and
// data backfills — things drizzle-kit cannot regenerate. Each file is written
// to be idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS, etc.) so re-running
// is safe.
//
// Run with: npx dotenv -e .env.local -- node scripts/apply-manual-migrations.mjs

import postgres from 'postgres'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'supabase', 'migrations-manual')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Use: npx dotenv -e .env.local -- node scripts/apply-manual-migrations.mjs')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

try {
  const entries = (await readdir(DIR)).filter(f => f.endsWith('.sql')).sort()
  if (!entries.length) {
    console.log('No .sql files in', DIR)
    process.exit(0)
  }

  for (const file of entries) {
    process.stdout.write(`▸ ${file} ... `)
    const content = await readFile(path.join(DIR, file), 'utf8')
    await sql.unsafe(content)
    console.log('ok')
  }
  console.log(`Applied ${entries.length} manual migration(s).`)
} catch (err) {
  console.error('\n✗ Manual migration failed:', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await sql.end()
}
