// Wipe the Café Lina (SMOKE) test data and the Supabase auth user.
import 'dotenv/config'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'smoketest+lina@sizzle.local'

const sql = postgres(process.env.DATABASE_URL, { prepare: false })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

try {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const u = list?.users?.find(x => x.email === TEST_EMAIL)
  if (!u) {
    console.log('No smoke-test auth user — already clean.')
  } else {
    const [row] = await sql`SELECT account_id FROM users WHERE id = ${u.id}`
    if (row) {
      await sql`DELETE FROM accounts WHERE id = ${row.account_id}` // cascades everything
      console.log('Deleted account (cascade)')
    }
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) throw error
    console.log('Deleted auth user', u.id.slice(0,8)+'..')
  }
} finally {
  await sql.end()
}
