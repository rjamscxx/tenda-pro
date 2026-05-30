// Wipe smoke-test seeds + their Supabase auth users.
//   node scratch-cleanup-smoke.mjs                 # all themes
//   node scratch-cleanup-smoke.mjs --theme=ramen   # one theme
import 'dotenv/config'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import { themes, themeSlugs, getTheme } from './seed-themes.mjs'

const args = process.argv.slice(2)
const themeArg = args.find(a => a.startsWith('--theme='))?.slice('--theme='.length) ?? null
if (themeArg && !themes[themeArg]) {
  console.error(`Unknown theme: "${themeArg}". Available: ${themeSlugs.join(', ')}`)
  process.exit(1)
}

const targets = themeArg ? [getTheme(themeArg)] : themeSlugs.map(getTheme)
const emailFor = (suffix) => `smoketest+${suffix}@sizzle.local`

const sql = postgres(process.env.DATABASE_URL, { prepare: false })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

try {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 500 })
  let cleaned = 0
  for (const theme of targets) {
    const email = emailFor(theme.emailSuffix)
    const u = list?.users?.find(x => x.email === email)
    if (!u) {
      console.log(`• ${theme.slug.padEnd(12)} no auth user — already clean`)
      continue
    }
    const [row] = await sql`SELECT account_id FROM users WHERE id = ${u.id}`
    if (row) {
      await sql`DELETE FROM accounts WHERE id = ${row.account_id}` // cascades everything
    }
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) throw error
    console.log(`• ${theme.slug.padEnd(12)} wiped (${u.id.slice(0,8)}..)`)
    cleaned++
  }
  if (cleaned === 0 && targets.length > 0) {
    console.log('\nNothing to clean.')
  } else {
    console.log(`\n✓ cleanup complete — ${cleaned} ${cleaned === 1 ? 'theme' : 'themes'} wiped`)
  }
} finally {
  await sql.end()
}
