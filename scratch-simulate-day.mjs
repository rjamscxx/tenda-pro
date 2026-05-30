// ─────────────────────────────────────────────────────────────────────────────
// Themed smoke-data simulator.
//
// Spins up a fully-stocked Premium account for a chosen business vertical:
//   node scratch-simulate-day.mjs                 # default theme (cafe)
//   node scratch-simulate-day.mjs --theme=ramen   # one specific theme
//   node scratch-simulate-day.mjs --all           # seed every theme
//   node scratch-simulate-day.mjs --list          # show available themes
//
// Each theme creates: 1 Supabase auth user (smoketest+<suffix>@sizzle.local),
// 1 premium account, 1 venue, ingredients, dishes+recipes, 8 days of sales
// (~hundreds of rows), today's ingredient deductions, expenses, waste logs,
// employees, a prior-week payroll run, and 14 days of shifts.
//
// Repeatable — wipes the prior account for the chosen suffix(es) before
// reseeding. Pure JS row generation, bulk INSERTs in 200/500-row chunks to
// minimize pooler roundtrips.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import { themes, themeSlugs, getTheme } from './seed-themes.mjs'

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name) => args.find(a => a === name || a.startsWith(name + '='))
const flagValue = (name) => {
  const f = flag(name); if (!f) return null
  if (f === name) return true
  return f.slice(name.length + 1)
}

if (flagValue('--list')) {
  console.log('Available themes:')
  for (const slug of themeSlugs) {
    const t = themes[slug]
    console.log(`  ${slug.padEnd(12)} ${t.venueName.padEnd(35)} (${t.ownerName})`)
  }
  process.exit(0)
}

const seedAll = !!flagValue('--all')
const themeArg = flagValue('--theme')
const chosenSlugs = seedAll
  ? themeSlugs
  : [themeArg ?? 'cafe']

for (const s of chosenSlugs) {
  if (!themes[s]) {
    console.error(`Unknown theme: "${s}". Available: ${themeSlugs.join(', ')}`)
    process.exit(1)
  }
}

// ── Shared helpers ───────────────────────────────────────────────────────────
const PHP = (cents) => `₱${(cents/100).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
const todayManilaISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
const dateOffset = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}
const tsAt = (dayOffset, hour, minute = null) => {
  // Approximate timestamp: Manila is UTC+8, so subtract 8 from the UTC hour.
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setUTCHours(hour - 8, minute ?? Math.floor(Math.random()*60), Math.floor(Math.random()*60), 0)
  return d
}
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]
const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
const TEST_PW = 'SmokeTest!123'
const emailFor = (suffix) => `smoketest+${suffix}@sizzle.local`

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Theme-runner ─────────────────────────────────────────────────────────────
async function seedTheme(theme) {
  console.log(`\n━━━ ${theme.venueName} — simulation start ━━━`)
  console.log(`Time zone: Asia/Manila · today = ${todayManilaISO()}`)

  const TEST_EMAIL = emailFor(theme.emailSuffix)

  // 1. Supabase Auth user
  let authUserId
  {
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 500 })
    const existing = list?.users?.find(u => u.email === TEST_EMAIL)
    if (existing) {
      authUserId = existing.id
      console.log(`• auth user already exists ${authUserId.slice(0,8)}..`)
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PW,
        email_confirm: true,
        user_metadata: { smoke_test: true, theme: theme.slug, persona: theme.ownerName },
      })
      if (error) throw error
      authUserId = data.user.id
      console.log(`• auth user created ${authUserId.slice(0,8)}..`)
    }
  }

  // 2. Wipe prior smoke account for this suffix (clean re-run)
  {
    const [existingUser] = await sql`SELECT account_id FROM users WHERE id = ${authUserId}`
    if (existingUser) {
      await sql`DELETE FROM accounts WHERE id = ${existingUser.account_id}`
      console.log('• prior smoke account wiped (cascade)')
    }
  }

  // 3. Account + User + Venue
  const accountId = randomUUID()
  const venueId   = randomUUID()
  {
    const planExpires  = new Date(); planExpires.setDate(planExpires.getDate() + 30)
    const trialStarted = new Date(); trialStarted.setDate(trialStarted.getDate() - 30)
    await sql`
      INSERT INTO accounts (id, plan, plan_expires_at, trial_started_at, ai_tokens_today, ai_tokens_date)
      VALUES (${accountId}, 'premium', ${planExpires}, ${trialStarted}, 0, ${todayManilaISO()})
    `
    await sql`
      INSERT INTO users (id, account_id, role, full_name)
      VALUES (${authUserId}, ${accountId}, 'owner', ${theme.ownerName + ' (SMOKE)'})
    `
    await sql`
      INSERT INTO venues (id, account_id, name, timezone, currency,
                          monthly_revenue_goal, monthly_expense_budget, vat_registered,
                          daily_revenue_target, food_cost_target, menu_theme)
      VALUES (${venueId}, ${accountId}, ${theme.venueName}, 'Asia/Manila', 'PHP',
              ${theme.monthlyRevGoal}, ${theme.monthlyExpBudget}, ${theme.vatRegistered},
              ${theme.dailyRevTarget}, ${theme.foodCostTarget}, ${theme.menuTheme})
    `
    console.log('• account/user/venue created')
  }

  // 4. Ingredients
  const ING = {}
  {
    const rows = theme.ingredients.map(i => {
      const id = randomUUID(); ING[i.key] = id
      return {
        id, venue_id: venueId, name: i.name, unit: i.unit,
        cost_per_unit: i.cost, stock_qty: String(i.stock), low_stock_threshold: String(i.low),
      }
    })
    await sql`
      INSERT INTO ingredients ${ sql(rows, 'id','venue_id','name','unit','cost_per_unit','stock_qty','low_stock_threshold') }
    `
    console.log(`• ingredients seeded: ${theme.ingredients.length}`)
  }

  // 5. Dishes + Recipes
  const D = {}
  {
    const dishRows = []
    const recipeRows = []
    for (const [key, d] of Object.entries(theme.dishes)) {
      const id = randomUUID(); D[key] = id
      dishRows.push({ id, venue_id: venueId, name: d.name, description: d.desc, category: d.cat, price: d.price })
      for (const [ingKey, qty] of d.recipe) {
        if (!ING[ingKey]) throw new Error(`[${theme.slug}] dish "${key}" references unknown ingredient "${ingKey}"`)
        recipeRows.push({ id: randomUUID(), dish_id: id, ingredient_id: ING[ingKey], qty: String(qty) })
      }
    }
    await sql`INSERT INTO dishes ${ sql(dishRows, 'id','venue_id','name','description','category','price') }`
    await sql`INSERT INTO recipe_items ${ sql(recipeRows, 'id','dish_id','ingredient_id','qty') }`
    console.log(`• dishes + recipes seeded: ${dishRows.length} dishes, ${recipeRows.length} recipe rows`)
  }

  // 6. Pre-compute per-dish food cost (cents)
  const dishCostCents = {}
  for (const [k, d] of Object.entries(theme.dishes)) {
    let c = 0
    for (const [ingKey, qty] of d.recipe) {
      const ing = theme.ingredients.find(s => s.key === ingKey)
      c += Number(qty) * ing.cost
    }
    dishCostCents[k] = Math.round(c)
  }

  // 7. Generate sales + items for all 8 days
  function pickFromGroup(groupKey) {
    const keys = theme.dishGroups[groupKey]
    if (!keys?.length) throw new Error(`[${theme.slug}] empty dish group "${groupKey}"`)
    return pick(keys)
  }
  function ticket(slot) {
    const items = []
    for (const [groupKey, prob] of slot.items) {
      // prob ≥ 1.0 → guaranteed; else sample.
      if (prob >= 1 || Math.random() < prob) {
        items.push({ dishKey: pickFromGroup(groupKey), qty: 1 })
      }
    }
    // Tiny chance of a duplicate (e.g., couple ordering same drink twice).
    if (items.length && Math.random() < 0.08) items[0].qty = 2
    return items
  }
  function channel() {
    const r = Math.random()
    let acc = 0
    for (const [c, p] of Object.entries(theme.channelMix)) {
      acc += p; if (r < acc) return c
    }
    return 'dine_in'
  }

  const saleRows = []
  const saleItemRows = []
  const todayDeductions = new Map() // ingredientId → today-only qty consumed
                                    // (historical days are assumed restocked overnight, like real ops)

  for (let i = 0; i < 8; i++) {
    const dayOff = -(7 - i)               // -7 ... 0  (i === 7 is today)
    const isToday = (i === 7)
    const sc     = theme.dayScales[i]
    for (const slot of theme.slots) {
      const n = Math.round(slot.count * sc)
      for (let j = 0; j < n; j++) {
        const items = ticket(slot)
        if (!items.length) continue
        const total = items.reduce((s, it) => s + it.qty * theme.dishes[it.dishKey].price, 0)
        const saleId = randomUUID()
        const soldAt = tsAt(dayOff, slot.hour + Math.floor(Math.random() * slot.window))
        saleRows.push({
          id: saleId, venue_id: venueId, user_id: authUserId,
          sold_at: soldAt, channel: channel(), total, note: null,
        })
        for (const it of items) {
          const dish = theme.dishes[it.dishKey]
          saleItemRows.push({
            id: randomUUID(), sale_id: saleId, dish_id: D[it.dishKey],
            qty: it.qty, unit_price: dish.price, unit_cost: dishCostCents[it.dishKey],
          })
          if (isToday) {
            for (const [ingKey, qty] of dish.recipe) {
              const ingId = ING[ingKey]
              todayDeductions.set(ingId, (todayDeductions.get(ingId) ?? 0) + Number(qty) * it.qty)
            }
          }
        }
      }
    }
  }
  console.log(`• generated ${saleRows.length} sales · ${saleItemRows.length} sale items in memory`)

  // Mark ~6 of today's lunch+afternoon tickets unpaid so toggle/filter have data
  {
    const todayUnpaidCandidates = saleRows.filter(s => {
      const hourUtc = new Date(s.sold_at).getUTCHours()
      const manilaHour = (hourUtc + 8) % 24
      return manilaHour >= 12 && manilaHour <= 17
    })
    const unpaidPicks = todayUnpaidCandidates
      .slice(-Math.min(6, todayUnpaidCandidates.length))
      .map(s => s.id)
    const unpaidNotes = ['Open tab — table 4', 'GCash pending', 'Utang from regular',
                         'Card decline retry', 'Bill pending — leaving 5min', 'Held for kitchen recount']
    for (const r of saleRows) {
      r.is_paid = !unpaidPicks.includes(r.id)
      if (!r.is_paid) r.note = pick(unpaidNotes)
    }
  }

  // 8. Bulk insert sales + sale_items
  console.log('• bulk inserting sales …')
  let inserted = 0
  for (const c of chunk(saleRows, 200)) {
    await sql`INSERT INTO sales ${ sql(c, 'id','venue_id','user_id','sold_at','channel','total','note','is_paid') }`
    inserted += c.length
    process.stdout.write(`  ${inserted}/${saleRows.length}\r`)
  }
  console.log()
  console.log('• bulk inserting sale_items …')
  inserted = 0
  for (const c of chunk(saleItemRows, 500)) {
    await sql`INSERT INTO sale_items ${ sql(c, 'id','sale_id','dish_id','qty','unit_price','unit_cost') }`
    inserted += c.length
    process.stdout.write(`  ${inserted}/${saleItemRows.length}\r`)
  }
  console.log()

  // 9. Apply today-only ingredient deductions
  console.log('• applying today-only ingredient deductions …')
  for (const [ingredientId, deduction] of todayDeductions) {
    await sql`
      UPDATE ingredients
      SET stock_qty  = GREATEST(0::numeric, stock_qty::numeric - ${String(deduction)}::numeric),
          updated_at = NOW()
      WHERE id = ${ingredientId} AND venue_id = ${venueId}
    `
  }

  // 10. Expenses
  {
    const today = todayManilaISO()
    const monthStart = today.slice(0,7) + '-01'
    const ex = theme.expensePattern
    const rows = [
      { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:today,      category:'ingredients', amount:ex.dailyIngredient, vendor:'Daily supplier delivery', note:null, is_recurring:false, recurrence_day:null },
      { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:today,      category:'utilities',   amount:Math.round(ex.monthlyUtilities/30), vendor:'Meralco', note:'Daily est. share', is_recurring:false, recurrence_day:null },
      { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:today,      category:'other',       amount:ex.other.amount, vendor:ex.other.vendor, note:ex.other.note, is_recurring:false, recurrence_day:null },
      { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:monthStart, category:'rent',        amount:ex.rentMonthly,  vendor:'Landlord Realty', note:'Monthly rent', is_recurring:true,  recurrence_day:1 },
    ]
    for (const h of ex.historical) {
      rows.push({
        id:randomUUID(), venue_id:venueId, user_id:authUserId,
        expensed_at:dateOffset(-h.dayBack),
        category:h.category, amount:h.amount, vendor:h.vendor, note:null,
        is_recurring:false, recurrence_day:null,
      })
    }
    await sql`INSERT INTO expenses ${ sql(rows, 'id','venue_id','user_id','expensed_at','category','amount','vendor','note','is_recurring','recurrence_day') }`
    console.log(`• expenses seeded: ${rows.length}`)
  }

  // 11. Waste logs
  {
    const rows = theme.waste.map(w => {
      const ing = theme.ingredients.find(i => i.key === w.ingKey)
      if (!ing) throw new Error(`[${theme.slug}] waste references unknown ingredient "${w.ingKey}"`)
      return {
        id: randomUUID(), venue_id: venueId, user_id: authUserId,
        ingredient_id: ING[w.ingKey], ingredient_name: ing.name,
        qty: w.qty, unit: w.unit, reason: w.reason,
        estimated_cost: w.cost, note: w.note, wasted_at: dateOffset(-w.dayBack),
      }
    })
    await sql`INSERT INTO waste_logs ${ sql(rows, 'id','venue_id','user_id','ingredient_id','ingredient_name','qty','unit','reason','estimated_cost','note','wasted_at') }`
    console.log(`• waste logs seeded: ${rows.length}`)
  }

  // 12. Employees + Payroll run
  const EMP = {}
  {
    const rows = theme.employees.map(s => {
      const id = randomUUID(); EMP[s.key] = id
      return {
        id, venue_id: venueId, full_name: s.fullName, role: s.role,
        pay_type: s.payType, pay_rate: s.payRate, start_date: dateOffset(-90),
        is_active: true, contact_number: `+63 917 555 ${Math.floor(1000+Math.random()*8999)}`,
      }
    })
    await sql`INSERT INTO employees ${ sql(rows, 'id','venue_id','full_name','role','pay_type','pay_rate','start_date','is_active','contact_number') }`

    const runId = randomUUID()
    const items = theme.payrollPreset
    const totalGross      = items.reduce((s,i)=>s+i.gross,0)
    const totalDeductions = items.reduce((s,i)=>s+i.deductions,0)
    const totalNet        = totalGross - totalDeductions
    await sql`
      INSERT INTO payroll_runs (id, venue_id, period_start, period_end, total_gross, total_deductions, total_net, note)
      VALUES (${runId}, ${venueId}, ${dateOffset(-13)}, ${dateOffset(-7)}, ${totalGross}, ${totalDeductions}, ${totalNet}, ${'Week ending ' + dateOffset(-7)})
    `
    const itemRows = items.map(it => ({
      id: randomUUID(), payroll_run_id: runId, employee_id: EMP[it.empKey],
      days_worked: it.days, gross_pay: it.gross, deductions: it.deductions, net_pay: it.gross - it.deductions, note: null,
    }))
    await sql`INSERT INTO payroll_items ${ sql(itemRows, 'id','payroll_run_id','employee_id','days_worked','gross_pay','deductions','net_pay','note') }`
    console.log(`• ${theme.employees.length} employees + 1 prior-week payroll run seeded`)
  }

  // 13. Shifts — 14 days (-13 → 0), mostly present, sprinkled absent/late/leave.
  //     The prior payroll run covers days -13..-7 so those shifts get the new
  //     "PAID" badge + the Pull-from-shifts modal raises the overlap warning.
  {
    const shiftRows = []
    // Preset rotation: assign each employee a fixed shift type so the calendar
    // looks like a real schedule rather than randomized chaos.
    const presets = ['opening','mid','closing','full','custom']
    const empPreset = new Map(theme.employees.map((e, idx) => [e.key, presets[idx % presets.length]]))
    const presetHours = { opening:8, mid:8, closing:8, full:16, custom:8 }
    const presetTimes = {
      opening:['06:00','14:00'], mid:['10:00','18:00'],
      closing:['14:00','22:00'], full:['06:00','22:00'], custom:['09:00','17:00'],
    }
    // Per pay-type → per-hour rate in cents.
    const hourlyOf = (emp) => {
      if (emp.payType === 'hourly')  return emp.payRate
      if (emp.payType === 'daily')   return Math.round(emp.payRate / 8)
      return Math.round(emp.payRate / (8 * 26)) // monthly
    }
    for (const emp of theme.employees) {
      const preset = empPreset.get(emp.key)
      const baseHours = presetHours[preset]
      const [timeIn, timeOut] = presetTimes[preset]
      const hourlyCents = hourlyOf(emp)
      for (let d = -13; d <= 0; d++) {
        // Sunday off (one day per week per employee, varying offset for realism)
        const dow = new Date(); dow.setDate(dow.getDate() + d)
        const sundayOff = dow.getDay() === 0 && (emp.key.charCodeAt(0) % 2 === 0)
        if (sundayOff) continue

        const roll = Math.random()
        let status, otHours = 0, lateHours = 0
        if      (roll < 0.04) status = 'absent'
        else if (roll < 0.06) status = 'leave'
        else if (roll < 0.18) { status = 'late'; lateHours = Math.random() < 0.6 ? 0.25 : 0.5 }
        else                  status = 'present'
        if (status === 'present' && Math.random() < 0.18) {
          otHours = Math.random() < 0.5 ? 0.5 : 1   // occasional OT
        }

        const hours = (status === 'absent' || status === 'leave') ? 0 : baseHours
        const billable = Math.max(0, hours + otHours - lateHours)
        const grossPay = (status === 'absent' || status === 'leave') ? 0 : Math.round(billable * hourlyCents)

        shiftRows.push({
          id: randomUUID(), venue_id: venueId, employee_id: EMP[emp.key],
          shift_date: dateOffset(d),
          shift_type: preset, status,
          time_in: timeIn, time_out: timeOut,
          hours_worked: String(hours), ot_hours: String(otHours), late_hours: String(lateHours),
          gross_pay: grossPay, note: null, created_by: authUserId,
        })
      }
    }
    for (const c of chunk(shiftRows, 200)) {
      await sql`INSERT INTO shifts ${ sql(c, 'id','venue_id','employee_id','shift_date','shift_type','status','time_in','time_out','hours_worked','ot_hours','late_hours','gross_pay','note','created_by') }`
    }
    console.log(`• shifts seeded: ${shiftRows.length} rows across ${theme.employees.length} employees over 14 days`)
  }

  // 14. Dashboard read-back
  console.log(`\n━━━ DASHBOARD VIEW — ${theme.venueName} ━━━`)
  const today      = todayManilaISO()
  const monthStart = today.slice(0,7) + '-01'

  const [revToday]    = await sql`SELECT COALESCE(SUM(total),0)::int AS v FROM sales WHERE venue_id=${venueId} AND (sold_at AT TIME ZONE 'Asia/Manila')::date = ${today}`
  const [revMonth]    = await sql`SELECT COALESCE(SUM(total),0)::int AS v FROM sales WHERE venue_id=${venueId} AND (sold_at AT TIME ZONE 'Asia/Manila')::date >= ${monthStart}`
  const [expToday]    = await sql`SELECT COALESCE(SUM(amount),0)::int AS v FROM expenses WHERE venue_id=${venueId} AND expensed_at = ${today}`
  const [fcToday]     = await sql`SELECT COALESCE(SUM(si.qty*si.unit_cost),0)::int AS v FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.venue_id=${venueId} AND (s.sold_at AT TIME ZONE 'Asia/Manila')::date = ${today}`
  const [fcMonth]     = await sql`SELECT COALESCE(SUM(si.qty*si.unit_cost),0)::int AS v FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.venue_id=${venueId} AND (s.sold_at AT TIME ZONE 'Asia/Manila')::date >= ${monthStart}`
  const [wasteToday]  = await sql`SELECT COALESCE(SUM(estimated_cost),0)::int AS v FROM waste_logs WHERE venue_id=${venueId} AND wasted_at=${today}`

  const topSellers = await sql`
    SELECT d.name, SUM(si.qty)::int AS qty, SUM(si.qty*si.unit_price)::int AS revenue
    FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN dishes d ON d.id=si.dish_id
    WHERE s.venue_id=${venueId} AND (s.sold_at AT TIME ZONE 'Asia/Manila')::date = ${today}
    GROUP BY d.name ORDER BY qty DESC LIMIT 5
  `
  const lowStock = await sql`
    SELECT name, stock_qty, low_stock_threshold, unit FROM ingredients
    WHERE venue_id=${venueId} AND stock_qty::numeric <= low_stock_threshold::numeric
    ORDER BY (stock_qty::numeric / NULLIF(low_stock_threshold::numeric, 0)) ASC
  `

  const fcPct       = revToday.v > 0 ? (fcToday.v / revToday.v * 100).toFixed(1) : 'n/a'
  const monthMargin = revMonth.v > 0 ? ((revMonth.v - fcMonth.v) / revMonth.v * 100).toFixed(1) : 'n/a'
  const netToday    = revToday.v - expToday.v - fcToday.v - wasteToday.v

  const title = `${theme.venueName} — ${today}`
  const w = Math.max(title.length + 4, 48)
  console.log('┌' + '─'.repeat(w-2) + '┐')
  console.log(`│  ${title.padEnd(w-4)}│`)
  console.log('├' + '─'.repeat(w-2) + '┤')
  const row = (label, val) => console.log(`│  ${label.padEnd(20)} ${String(val).padStart(w-26)} │`)
  row('Revenue today',      PHP(revToday.v))
  row('Revenue this month', PHP(revMonth.v))
  row('Food cost today',    `${fcPct}%`)
  row('Margin (month)',     `${monthMargin}%`)
  row('Expenses today',     PHP(expToday.v))
  row('Waste today',        PHP(wasteToday.v))
  row('Net profit today',   PHP(netToday))
  console.log('└' + '─'.repeat(w-2) + '┘')

  console.log('\nTop sellers today:')
  for (const t of topSellers) console.log(`  • ${t.name.padEnd(24)} qty ${String(t.qty).padStart(3)}   rev ${PHP(t.revenue)}`)

  console.log('\nLow-stock alerts:')
  if (!lowStock.length) console.log('  (none — every ingredient above threshold)')
  else for (const l of lowStock) console.log(`  • ${l.name.padEnd(24)} ${l.stock_qty}${l.unit} (threshold ${l.low_stock_threshold}${l.unit})`)

  // 15. Login handoff
  console.log(`\n━━━ READY TO BROWSE — ${theme.slug} ━━━`)
  console.log(`  URL      http://localhost:3000/login`)
  console.log(`  Email    ${TEST_EMAIL}`)
  console.log(`  Password ${TEST_PW}`)
  console.log(`  Venue    ${theme.venueName}`)
  console.log(`  Plan     Premium · expires in 30 days`)
  console.log(`  QR menu  http://localhost:3000/m/${venueId}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────
try {
  for (const slug of chosenSlugs) {
    await seedTheme(getTheme(slug))
  }
  console.log('\n✓ simulation complete')
  if (chosenSlugs.length > 1) {
    console.log(`  Seeded ${chosenSlugs.length} themes: ${chosenSlugs.join(', ')}`)
  }
  console.log('\nWhen done browsing, run:  node scratch-cleanup-smoke.mjs  (cleans all themes)')
  console.log('                       or  node scratch-cleanup-smoke.mjs --theme=<slug>  (one theme)')
} finally {
  await sql.end()
}
