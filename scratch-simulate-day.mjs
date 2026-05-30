// ─────────────────────────────────────────────────────────────────────────────
// Café Lina (SMOKE) — simulate a Manila café operating day end-to-end.
//
// Generates all rows in JS, then BULK INSERTS to minimize pooler roundtrips.
// Final ingredient stock = starting_stock − sum(all_deductions) (floored at 0).
//
// Creates: 1 Supabase auth user, 1 premium account, 1 venue,
//          14 ingredients, 12 dishes, recipes,
//          7 historical days + a full "today" of sales/expenses/waste,
//          3 employees + 1 past-week payroll run.
//
// Everything is tagged "(SMOKE)" / smoketest+lina@sizzle.local for cleanup.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'

// ── Helpers ──────────────────────────────────────────────────────────────────
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

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TEST_EMAIL = 'smoketest+lina@sizzle.local'
const TEST_PW    = 'SmokeTest!123'

console.log('━━━ Café Lina (SMOKE) — simulation start ━━━')
console.log(`Time zone: Asia/Manila · today = ${todayManilaISO()}`)

// ── 1. Supabase Auth user ────────────────────────────────────────────────────
let authUserId
{
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const existing = list?.users?.find(u => u.email === TEST_EMAIL)
  if (existing) {
    authUserId = existing.id
    console.log(`• auth user already exists ${authUserId.slice(0,8)}..`)
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PW,
      email_confirm: true,
      user_metadata: { smoke_test: true, persona: 'Lina Hartono' },
    })
    if (error) throw error
    authUserId = data.user.id
    console.log(`• auth user created ${authUserId.slice(0,8)}..`)
  }
}

// ── 2. Wipe prior smoke account for a clean re-run ───────────────────────────
{
  const [existingUser] = await sql`SELECT account_id FROM users WHERE id = ${authUserId}`
  if (existingUser) {
    await sql`DELETE FROM accounts WHERE id = ${existingUser.account_id}`
    console.log('• prior smoke account wiped (cascade)')
  }
}

// ── 3. Account + User + Venue ────────────────────────────────────────────────
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
    VALUES (${authUserId}, ${accountId}, 'owner', 'Lina Hartono (SMOKE)')
  `
  await sql`
    INSERT INTO venues (id, account_id, name, timezone, currency,
                        monthly_revenue_goal, monthly_expense_budget, vat_registered,
                        daily_revenue_target, food_cost_target, menu_theme)
    VALUES (${venueId}, ${accountId}, 'Café Lina (SMOKE)', 'Asia/Manila', 'PHP',
            50000000, 35000000, false, 1500000, 32, 'sage-dark')
  `
  console.log('• account/user/venue created')
}

// ── 4. Ingredients ───────────────────────────────────────────────────────────
// Starting stock = "what was on hand at open this morning".
// Tuned so today's ~92-ticket run leaves bread/eggs/cheese/croissant/roll just below
// their thresholds (5 visible low-stock alerts), with milk + butter close-but-above.
const ingredientSeed = [
  { key:'coffee',          name:'Coffee Beans',        unit:'g',   cost:70,   stock:2500,  low:500  },
  { key:'milk',            name:'Fresh Milk',          unit:'mL',  cost:12,   stock:10000, low:1500 },
  { key:'bread',           name:'Bread (slice)',       unit:'pcs', cost:800,  stock:35,    low:10   },
  { key:'eggs',            name:'Eggs',                unit:'pcs', cost:900,  stock:22,    low:8    },
  { key:'pancake',         name:'Pancake Mix',         unit:'g',   cost:18,   stock:1500,  low:400  },
  { key:'sugar',           name:'Sugar',               unit:'g',   cost:8,    stock:600,   low:300  },
  { key:'butter',          name:'Butter',              unit:'g',   cost:60,   stock:600,   low:150  },
  { key:'tuna',            name:'Tuna (can)',          unit:'pcs', cost:8500, stock:8,     low:3    },
  { key:'cheese',          name:'Cheese',              unit:'g',   cost:50,   stock:600,   low:120  },
  { key:'tea',             name:'Tea Bags',            unit:'pcs', cost:1500, stock:30,    low:15   },
  { key:'tomato',          name:'Tomatoes',            unit:'g',   cost:12,   stock:800,   low:250  },
  { key:'lettuce',         name:'Lettuce',             unit:'g',   cost:15,   stock:500,   low:150  },
  { key:'croissant_stock', name:'Croissant Stock',     unit:'pcs', cost:4000, stock:20,    low:8    },
  { key:'roll_stock',      name:'Cinnamon Roll Stock', unit:'pcs', cost:5000, stock:18,    low:6    },
]
const ING = {}
{
  const rows = ingredientSeed.map(i => {
    const id = randomUUID(); ING[i.key] = id
    return {
      id, venue_id: venueId, name: i.name, unit: i.unit,
      cost_per_unit: i.cost, stock_qty: String(i.stock), low_stock_threshold: String(i.low),
    }
  })
  await sql`
    INSERT INTO ingredients ${ sql(rows, 'id','venue_id','name','unit','cost_per_unit','stock_qty','low_stock_threshold') }
  `
  console.log(`• ingredients seeded: ${ingredientSeed.length}`)
}

// ── 5. Dishes + Recipes ──────────────────────────────────────────────────────
const DISHES = {
  americano:   { name:'Americano',         desc:'Double shot espresso with hot water',           cat:'Drinks',     price:12000, recipe:[['coffee',18]] },
  cappuccino:  { name:'Cappuccino',        desc:'Espresso, steamed milk, foam crown',            cat:'Drinks',     price:15000, recipe:[['coffee',18],['milk',150]] },
  latte:       { name:'Café Latte',        desc:'Espresso layered with silky steamed milk',      cat:'Drinks',     price:16000, recipe:[['coffee',18],['milk',200]] },
  milktea:     { name:'House Milk Tea',    desc:'Loose-leaf black tea with sugar & milk',         cat:'Drinks',     price:13000, recipe:[['tea',1],['milk',200],['sugar',15]] },
  espresso:    { name:'Espresso',          desc:'Single shot of our house blend',                 cat:'Drinks',     price: 9000, recipe:[['coffee',12]] },
  matcha:      { name:'Matcha Latte',      desc:'Ceremonial-grade matcha with steamed milk',      cat:'Drinks',     price:17000, recipe:[['milk',200],['sugar',10]] },
  pancakes:    { name:'Pancake Stack',     desc:'Three buttermilk pancakes with maple butter',    cat:'Breakfast',  price:22000, recipe:[['pancake',120],['eggs',1],['butter',30],['sugar',20]] },
  eggstoast:   { name:'Eggs & Toast',      desc:'Two eggs your way, buttered sourdough',          cat:'Breakfast',  price:18000, recipe:[['eggs',2],['bread',2],['butter',20]] },
  tuna:        { name:'Tuna Sandwich',     desc:'Tuna salad, cheese, fresh lettuce & tomato',     cat:'Sandwiches', price:18000, recipe:[['tuna',0.25],['bread',2],['cheese',20],['lettuce',30],['tomato',20]] },
  cheesetoast: { name:'Grilled Cheese',    desc:'Triple cheese melt on buttered sourdough',       cat:'Sandwiches', price:16000, recipe:[['bread',2],['cheese',60],['butter',15]] },
  croissant:   { name:'Butter Croissant',  desc:'Flaky, golden, baked in-house every morning',    cat:'Pastry',     price: 9500, recipe:[['croissant_stock',1]] },
  cinnaroll:   { name:'Cinnamon Roll',     desc:'Warm sweet roll with cream-cheese glaze',         cat:'Pastry',     price:11000, recipe:[['roll_stock',1]] },
}
const D = {}
{
  const dishRows = []
  const recipeRows = []
  for (const [key, d] of Object.entries(DISHES)) {
    const id = randomUUID(); D[key] = id
    dishRows.push({ id, venue_id: venueId, name: d.name, description: d.desc, category: d.cat, price: d.price })
    for (const [ingKey, qty] of d.recipe) {
      recipeRows.push({ id: randomUUID(), dish_id: id, ingredient_id: ING[ingKey], qty: String(qty) })
    }
  }
  await sql`INSERT INTO dishes ${ sql(dishRows, 'id','venue_id','name','description','category','price') }`
  await sql`INSERT INTO recipe_items ${ sql(recipeRows, 'id','dish_id','ingredient_id','qty') }`
  console.log(`• dishes + recipes seeded: ${dishRows.length} dishes, ${recipeRows.length} recipe rows`)
}

// ── 6. Pre-compute per-dish food cost (cents) ────────────────────────────────
const dishCostCents = {}
for (const [k, d] of Object.entries(DISHES)) {
  let c = 0
  for (const [ingKey, qty] of d.recipe) {
    const ing = ingredientSeed.find(s => s.key === ingKey)
    c += Number(qty) * ing.cost
  }
  dishCostCents[k] = Math.round(c)
}

// ── 7. Generate sales + items in JS for all 8 days ───────────────────────────
const drinks    = ['americano','cappuccino','latte','milktea','espresso','matcha']
const breakfast = ['pancakes','eggstoast']
const sandwich  = ['tuna','cheesetoast']
const pastry    = ['croissant','cinnaroll']

function ticket(slot) {
  const items = []
  if (slot === 'breakfast') {
    items.push({ dishKey: pick(drinks), qty: 1 })
    if (Math.random() < 0.55) items.push({ dishKey: pick(breakfast), qty: 1 })
    if (Math.random() < 0.2)  items.push({ dishKey: pick(pastry),    qty: 1 })
  } else if (slot === 'midmorning') {
    items.push({ dishKey: pick(drinks), qty: 1 })
    if (Math.random() < 0.45) items.push({ dishKey: pick(pastry), qty: 1 })
  } else if (slot === 'lunch') {
    items.push({ dishKey: pick(sandwich), qty: 1 })
    items.push({ dishKey: pick(drinks),   qty: 1 })
    if (Math.random() < 0.25) items.push({ dishKey: pick(pastry), qty: 1 })
  } else if (slot === 'afternoon') {
    items.push({ dishKey: pick(drinks), qty: 1 })
    if (Math.random() < 0.5) items.push({ dishKey: pick(pastry), qty: 1 })
  } else { // evening
    items.push({ dishKey: pick(drinks), qty: 1 })
    if (Math.random() < 0.3) items.push({ dishKey: pick(sandwich), qty: 1 })
  }
  return items
}
function channel() {
  const r = Math.random()
  if (r < 0.72) return 'dine_in'
  if (r < 0.88) return 'takeout'
  return 'delivery'
}

// Day-of-week-ish scales (8 days back to today)
const scales = [1.05, 0.90, 1.15, 0.85, 1.10, 1.20, 0.95, 1.00]
// slots: [name, count_at_scale_1, start_hour, hour_window]
const slots = [
  ['breakfast', 22,  7, 3],
  ['midmorning',10, 10, 2],
  ['lunch',     30, 12, 2],
  ['afternoon', 18, 14, 3],
  ['evening',   12, 17, 2],
]

const saleRows     = []
const saleItemRows = []
const todayDeductions = new Map() // ingredientId → today-only qty consumed
                                  // (historical days are assumed restocked overnight, like a real café)

for (let i = 0; i < 8; i++) {
  const dayOff = -(7 - i)               // -7 ... 0  (i === 7 is today)
  const isToday = (i === 7)
  const sc     = scales[i]
  for (const [slotName, count, startHr, hrWin] of slots) {
    const n = Math.round(count * sc)
    for (let j = 0; j < n; j++) {
      const items = ticket(slotName)
      const total = items.reduce((s, it) => s + it.qty * DISHES[it.dishKey].price, 0)
      const saleId = randomUUID()
      const soldAt = tsAt(dayOff, startHr + Math.floor(Math.random() * hrWin))
      saleRows.push({
        id: saleId, venue_id: venueId, user_id: authUserId,
        sold_at: soldAt, channel: channel(), total, note: null,
      })
      for (const it of items) {
        saleItemRows.push({
          id: randomUUID(), sale_id: saleId, dish_id: D[it.dishKey],
          qty: it.qty, unit_price: DISHES[it.dishKey].price, unit_cost: dishCostCents[it.dishKey],
        })
        if (isToday) {
          for (const [ingKey, qty] of DISHES[it.dishKey].recipe) {
            const ingId = ING[ingKey]
            todayDeductions.set(ingId, (todayDeductions.get(ingId) ?? 0) + Number(qty) * it.qty)
          }
        }
      }
    }
  }
}
console.log(`• generated ${saleRows.length} sales · ${saleItemRows.length} sale items in memory`)

// Mark a handful of today's later sales as unpaid so the new toggle/filter
// have realistic data to show. Picks ~6 of today's lunch+afternoon tickets.
{
  const todayUnpaidCandidates = saleRows.filter(s => {
    const hourUtc = new Date(s.sold_at).getUTCHours()
    const manilaHour = (hourUtc + 8) % 24
    return manilaHour >= 12 && manilaHour <= 17
  })
  const unpaidPicks = todayUnpaidCandidates
    .slice(-Math.min(6, todayUnpaidCandidates.length))
    .map(s => s.id)
  for (const r of saleRows) {
    r.is_paid = !unpaidPicks.includes(r.id)
    if (!r.is_paid) r.note = pick(['Open tab — table 4', 'GCash pending', 'Utang from regular', 'Card decline retry', 'Bill pending — leaving 5min', 'Held for kitchen recount'])
  }
}

// ── 8. Bulk insert sales + sale_items in 200-row chunks ──────────────────────
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

// ── 9. Apply today-only ingredient deductions ────────────────────────────────
console.log('• applying today-only ingredient deductions …')
for (const [ingredientId, deduction] of todayDeductions) {
  await sql`
    UPDATE ingredients
    SET stock_qty  = GREATEST(0::numeric, stock_qty::numeric - ${String(deduction)}::numeric),
        updated_at = NOW()
    WHERE id = ${ingredientId} AND venue_id = ${venueId}
  `
}

// ── 10. Expenses ─────────────────────────────────────────────────────────────
{
  const today = todayManilaISO()
  const monthStart = today.slice(0,7) + '-01'
  const rows = [
    { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:today,      category:'ingredients', amount: 280000, vendor:'Mercado Suppliers', note:'Daily milk/egg/bread delivery', is_recurring:false, recurrence_day:null },
    { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:today,      category:'utilities',   amount:  18000, vendor:'Meralco',           note:'Daily est. share',              is_recurring:false, recurrence_day:null },
    { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:today,      category:'other',       amount:  40000, vendor:'SM Supermarket',    note:'Cleaning supplies',             is_recurring:false, recurrence_day:null },
    { id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:monthStart, category:'rent',        amount:2500000, vendor:'Landlord Realty',   note:'Monthly rent',                  is_recurring:true,  recurrence_day:1    },
  ]
  // 7 days of past expenses (sparse)
  for (let i = 1; i <= 7; i++) {
    if (i % 2 === 1) rows.push({ id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:dateOffset(-i), category:'ingredients', amount:240000+Math.floor(Math.random()*80000), vendor:'Mercado Suppliers', note:null, is_recurring:false, recurrence_day:null })
    if (i === 5)     rows.push({ id:randomUUID(), venue_id:venueId, user_id:authUserId, expensed_at:dateOffset(-i), category:'utilities',   amount: 15000, vendor:'Meralco', note:null, is_recurring:false, recurrence_day:null })
  }
  await sql`INSERT INTO expenses ${ sql(rows, 'id','venue_id','user_id','expensed_at','category','amount','vendor','note','is_recurring','recurrence_day') }`
  console.log(`• expenses seeded: ${rows.length}`)
}

// ── 11. Waste logs ───────────────────────────────────────────────────────────
{
  const today = todayManilaISO()
  const seeds = [
    { ingKey:'croissant_stock', qty:'2',   unit:'pcs', reason:'overcooked', cost: 8000, note:'Burned in oven',    wasted_at: today },
    { ingKey:'roll_stock',      qty:'1',   unit:'pcs', reason:'dropped',    cost: 5000, note:'Slipped off tray',  wasted_at: today },
    { ingKey:'milk',            qty:'200', unit:'mL',  reason:'spoilage',   cost: 2400, note:'Expired carton',    wasted_at: dateOffset(-2) },
  ]
  const rows = seeds.map(s => ({
    id: randomUUID(), venue_id: venueId, user_id: authUserId,
    ingredient_id: ING[s.ingKey], ingredient_name: ingredientSeed.find(i=>i.key===s.ingKey).name,
    qty: s.qty, unit: s.unit, reason: s.reason,
    estimated_cost: s.cost, note: s.note, wasted_at: s.wasted_at,
  }))
  await sql`INSERT INTO waste_logs ${ sql(rows, 'id','venue_id','user_id','ingredient_id','ingredient_name','qty','unit','reason','estimated_cost','note','wasted_at') }`
  console.log(`• waste logs seeded: ${rows.length}`)
}

// ── 12. Employees + Payroll run ──────────────────────────────────────────────
const EMP = {}
{
  const seeds = [
    { key:'lola', full_name:'Lola Maria Reyes', role:'Cashier', pay_type:'daily',  pay_rate: 50000 },
    { key:'juan', full_name:'Juan Dela Cruz',   role:'Barista', pay_type:'daily',  pay_rate: 70000 },
    { key:'joey', full_name:'Joey Ramos',       role:'Server',  pay_type:'hourly', pay_rate:  8000 },
  ]
  const rows = seeds.map(s => {
    const id = randomUUID(); EMP[s.key] = id
    return {
      id, venue_id: venueId, full_name: s.full_name, role: s.role,
      pay_type: s.pay_type, pay_rate: s.pay_rate, start_date: dateOffset(-90),
      is_active: true, contact_number: `+63 917 555 ${Math.floor(1000+Math.random()*8999)}`,
    }
  })
  await sql`INSERT INTO employees ${ sql(rows, 'id','venue_id','full_name','role','pay_type','pay_rate','start_date','is_active','contact_number') }`

  const runId = randomUUID()
  const items = [
    { emp:'lola', days:'6.00', gross: 300000, deductions: 18000 },
    { emp:'juan', days:'6.00', gross: 420000, deductions: 25200 },
    { emp:'joey', days:'3.00', gross: 192000, deductions:  9600 },
  ]
  const totalGross      = items.reduce((s,i)=>s+i.gross,0)
  const totalDeductions = items.reduce((s,i)=>s+i.deductions,0)
  const totalNet        = totalGross - totalDeductions
  await sql`
    INSERT INTO payroll_runs (id, venue_id, period_start, period_end, total_gross, total_deductions, total_net, note)
    VALUES (${runId}, ${venueId}, ${dateOffset(-13)}, ${dateOffset(-7)}, ${totalGross}, ${totalDeductions}, ${totalNet}, ${'Week ending ' + dateOffset(-7)})
  `
  const itemRows = items.map(it => ({
    id: randomUUID(), payroll_run_id: runId, employee_id: EMP[it.emp],
    days_worked: it.days, gross_pay: it.gross, deductions: it.deductions, net_pay: it.gross - it.deductions, note: null,
  }))
  await sql`INSERT INTO payroll_items ${ sql(itemRows, 'id','payroll_run_id','employee_id','days_worked','gross_pay','deductions','net_pay','note') }`
  console.log('• 3 employees + 1 prior-week payroll run seeded')
}

// ── 13. Dashboard read-back ──────────────────────────────────────────────────
console.log('\n━━━ DASHBOARD VIEW — what RJ will see ━━━')
const today      = todayManilaISO()
const monthStart = today.slice(0,7) + '-01'

const [revToday]    = await sql`SELECT COALESCE(SUM(total),0)::int AS v FROM sales WHERE venue_id=${venueId} AND (sold_at AT TIME ZONE 'Asia/Manila')::date = ${today}`
const [revMonth]    = await sql`SELECT COALESCE(SUM(total),0)::int AS v FROM sales WHERE venue_id=${venueId} AND (sold_at AT TIME ZONE 'Asia/Manila')::date >= ${monthStart}`
const [expToday]    = await sql`SELECT COALESCE(SUM(amount),0)::int AS v FROM expenses WHERE venue_id=${venueId} AND expensed_at = ${today}`
const [expMonth]    = await sql`SELECT COALESCE(SUM(amount),0)::int AS v FROM expenses WHERE venue_id=${venueId} AND expensed_at >= ${monthStart}`
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

console.log('┌──────────────────────────────────────────────┐')
console.log(`│  Café Lina (SMOKE) — ${today}              │`)
console.log('├──────────────────────────────────────────────┤')
console.log(`│  Revenue today        ${PHP(revToday.v).padStart(18)} │`)
console.log(`│  Revenue this month   ${PHP(revMonth.v).padStart(18)} │`)
console.log(`│  Food cost today      ${(fcPct+'%').padStart(18)} │`)
console.log(`│  Margin (month)       ${(monthMargin+'%').padStart(18)} │`)
console.log(`│  Expenses today       ${PHP(expToday.v).padStart(18)} │`)
console.log(`│  Waste today          ${PHP(wasteToday.v).padStart(18)} │`)
console.log(`│  Net profit today     ${PHP(netToday).padStart(18)} │`)
console.log('└──────────────────────────────────────────────┘')

console.log('\nTop sellers today:')
for (const t of topSellers) console.log(`  • ${t.name.padEnd(22)} qty ${String(t.qty).padStart(3)}   rev ${PHP(t.revenue)}`)

console.log('\nLow-stock alerts:')
if (!lowStock.length) console.log('  (none — every ingredient above threshold)')
else for (const l of lowStock) console.log(`  • ${l.name.padEnd(22)} ${l.stock_qty}${l.unit} (threshold ${l.low_stock_threshold}${l.unit})`)

// ── 14. AI tool simulation ───────────────────────────────────────────────────
console.log('\n━━━ AI TOOLS — what the chat widget would answer ━━━')

const [sales7]  = await sql`SELECT COALESCE(SUM(total),0)::int AS revenue, COUNT(*)::int AS tickets FROM sales WHERE venue_id=${venueId} AND (sold_at AT TIME ZONE 'Asia/Manila')::date >= ${dateOffset(-6)}`
console.log(`get_sales_summary(7d)    → ${PHP(sales7.revenue)} across ${sales7.tickets} tickets`)

const top7 = await sql`
  SELECT d.name, SUM(si.qty)::int AS qty
  FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN dishes d ON d.id=si.dish_id
  WHERE s.venue_id=${venueId} AND (s.sold_at AT TIME ZONE 'Asia/Manila')::date >= ${dateOffset(-6)}
  GROUP BY d.name ORDER BY qty DESC LIMIT 3
`
console.log(`get_top_dishes(7d)       → ${top7.map(t => `${t.name} (${t.qty})`).join(', ')}`)
console.log(`get_low_stock            → ${lowStock.length} ingredient(s) at/below threshold`)

const margins = await sql`
  WITH dish_avg AS (
    SELECT d.id, d.name, d.price, COALESCE(AVG(si.unit_cost), 0)::int AS avg_cost
    FROM dishes d LEFT JOIN sale_items si ON si.dish_id = d.id
    WHERE d.venue_id=${venueId} GROUP BY d.id, d.name, d.price
  )
  SELECT name, price, avg_cost,
    CASE WHEN price > 0 THEN ((price - avg_cost) * 100.0 / price) ELSE 0 END AS margin_pct
  FROM dish_avg ORDER BY margin_pct DESC NULLS LAST LIMIT 5
`
console.log('get_dish_margins (top 5) →')
for (const m of margins) console.log(`  ${m.name.padEnd(20)} price ${PHP(m.price).padStart(8)}   cost ${PHP(m.avg_cost ?? 0).padStart(8)}   margin ${Number(m.margin_pct).toFixed(1)}%`)

const expByCat = await sql`SELECT category, SUM(amount)::int AS amt FROM expenses WHERE venue_id=${venueId} AND expensed_at >= ${monthStart} GROUP BY category ORDER BY amt DESC`
console.log('get_expense_summary (mo) →')
for (const e of expByCat) console.log(`  ${e.category.padEnd(15)} ${PHP(e.amt)}`)

const [payrollSum] = await sql`SELECT COUNT(*)::int AS runs, COALESCE(SUM(total_net),0)::int AS net FROM payroll_runs WHERE venue_id=${venueId}`
console.log(`get_payroll_summary      → ${payrollSum.runs} run(s), ${PHP(payrollSum.net)} total net`)

const [wasteWeek] = await sql`SELECT COALESCE(SUM(estimated_cost),0)::int AS v, COUNT(*)::int AS entries FROM waste_logs WHERE venue_id=${venueId} AND wasted_at >= ${dateOffset(-6)}`
console.log(`get_waste_summary(7d)    → ${PHP(wasteWeek.v)} across ${wasteWeek.entries} entries`)

// ── 15. Credentials handoff ──────────────────────────────────────────────────
console.log('\n━━━ READY TO BROWSE — login credentials ━━━')
console.log(`  URL      http://localhost:3000/login`)
console.log(`  Email    ${TEST_EMAIL}`)
console.log(`  Password ${TEST_PW}`)
console.log(`  Venue    Café Lina (SMOKE)`)
console.log(`  Plan     Premium · expires in 30 days`)
console.log(`  QR menu  http://localhost:3000/m/${venueId}`)
console.log('\nWhen done browsing, run:  node scratch-cleanup-smoke.mjs')

await sql.end()
console.log('\n✓ simulation complete')
