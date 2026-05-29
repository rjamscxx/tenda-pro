import {
  pgTable, pgEnum, uuid, text, integer, numeric,
  boolean, timestamp, date, jsonb, index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['owner', 'staff'])
export const saleChannelEnum = pgEnum('sale_channel', ['dine_in', 'takeout', 'delivery', 'other'])
export const expenseCategoryEnum = pgEnum('expense_category', [
  'ingredients', 'labor', 'rent', 'utilities', 'marketing', 'other',
])
export const wasteReasonEnum = pgEnum('waste_reason', ['spoilage', 'overcooked', 'dropped', 'expired', 'other'])
export const payTypeEnum = pgEnum('pay_type', ['daily', 'monthly', 'hourly'])

// ── Accounts ──────────────────────────────────────────────────────────────────

export const planEnum = pgEnum('plan', ['free', 'pro', 'premium'])

export const accounts = pgTable('accounts', {
  id:              uuid('id').primaryKey().defaultRandom(),
  plan:            planEnum('plan').notNull().default('free'),
  planExpiresAt:   timestamp('plan_expires_at', { withTimezone: true }),
  trialStartedAt:  timestamp('trial_started_at', { withTimezone: true }),
  // Daily AI token budget tracking (Premium-only feature).
  // aiTokensDate is the venue-local date the counter refers to; when a request
  // arrives on a new day we reset aiTokensToday to 0 before adding.
  aiTokensToday:   integer('ai_tokens_today').notNull().default(0),
  aiTokensDate:    date('ai_tokens_date'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Users (mirrors Supabase auth.users) ──────────────────────────────────────

export const users = pgTable('users', {
  id:         uuid('id').primaryKey(), // = Supabase auth.users.id
  accountId:  uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  role:       userRoleEnum('role').notNull().default('owner'),
  fullName:   text('full_name'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('users_account_idx').on(t.accountId)])

// ── Venues (1 per account in v1; schema is multi-venue ready) ────────────────

export const venues = pgTable('venues', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  accountId:             uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name:                  text('name').notNull(),
  timezone:              text('timezone').notNull().default('Asia/Manila'),
  currency:              text('currency').notNull().default('PHP'),
  monthlyRevenueGoal:    integer('monthly_revenue_goal').notNull().default(0),   // cents
  monthlyExpenseBudget:  integer('monthly_expense_budget').notNull().default(0), // cents
  vatRegistered:         boolean('vat_registered').notNull().default(false),
  dailyRevenueTarget:    integer('daily_revenue_target').notNull().default(0),   // cents; 0 = derive from monthly
  foodCostTarget:        integer('food_cost_target').notNull().default(35),      // %; "good" threshold
  menuTheme:             text('menu_theme').notNull().default('sage-dark'),       // theme applied to /m/[venueId] public menu
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('venues_account_idx').on(t.accountId)])

// ── Ingredients ───────────────────────────────────────────────────────────────

export const ingredients = pgTable('ingredients', {
  id:                uuid('id').primaryKey().defaultRandom(),
  venueId:           uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  name:              text('name').notNull(),
  unit:              text('unit').notNull(), // kg, g, L, mL, pcs …
  costPerUnit:       integer('cost_per_unit').notNull().default(0), // cents
  stockQty:          numeric('stock_qty', { precision: 12, scale: 4 }).notNull().default('0'),
  lowStockThreshold: numeric('low_stock_threshold', { precision: 12, scale: 4 }).notNull().default('0'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('ingredients_venue_idx').on(t.venueId)])

// ── Dishes ────────────────────────────────────────────────────────────────────

export const dishes = pgTable('dishes', {
  id:           uuid('id').primaryKey().defaultRandom(),
  venueId:      uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  description:  text('description'),                  // shown on the public QR menu; optional
  category:     text('category').notNull().default('Other'),
  price:        integer('price').notNull().default(0), // cents
  isActive:     boolean('is_active').notNull().default(true),
  soldOutDate:  date('sold_out_date'),                // null = available; today's date = 86'd
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('dishes_venue_idx').on(t.venueId)])

// ── Recipe Items ──────────────────────────────────────────────────────────────

export const recipeItems = pgTable('recipe_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  dishId:       uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  qty:          numeric('qty', { precision: 12, scale: 4 }).notNull(),
}, (t) => [
  index('recipe_items_dish_idx').on(t.dishId),
  index('recipe_items_ingredient_idx').on(t.ingredientId),
])

// ── Sales ─────────────────────────────────────────────────────────────────────

export const sales = pgTable('sales', {
  id:       uuid('id').primaryKey().defaultRandom(),
  venueId:  uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId:   uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  soldAt:   timestamp('sold_at', { withTimezone: true }).notNull().defaultNow(),
  channel:  saleChannelEnum('channel').notNull().default('dine_in'),
  total:    integer('total').notNull().default(0), // cents
  note:     text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('sales_venue_idx').on(t.venueId),
  index('sales_sold_at_idx').on(t.soldAt),
  index('sales_venue_date_idx').on(t.venueId, t.soldAt),
])

// ── Sale Items ────────────────────────────────────────────────────────────────

export const saleItems = pgTable('sale_items', {
  id:         uuid('id').primaryKey().defaultRandom(),
  saleId:     uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  dishId:     uuid('dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  qty:        integer('qty').notNull(),
  unitPrice:  integer('unit_price').notNull(), // cents, snapshot at sale time
  unitCost:   integer('unit_cost').notNull(),  // cents, snapshot at sale time
}, (t) => [index('sale_items_sale_idx').on(t.saleId)])

// ── Expenses ──────────────────────────────────────────────────────────────────

export const expenses = pgTable('expenses', {
  id:            uuid('id').primaryKey().defaultRandom(),
  venueId:       uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId:        uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  expensedAt:    date('expensed_at').notNull(),
  category:      expenseCategoryEnum('category').notNull().default('other'),
  amount:        integer('amount').notNull(), // cents
  vendor:        text('vendor'),
  note:          text('note'),
  isRecurring:   boolean('is_recurring').notNull().default(false),
  recurrenceDay: integer('recurrence_day'), // 1-28, day of month it recurs
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('expenses_venue_idx').on(t.venueId),
  index('expenses_date_idx').on(t.expensedAt),
  index('expenses_venue_date_idx').on(t.venueId, t.expensedAt),
])

// ── Audit Log ─────────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id:         uuid('id').primaryKey().defaultRandom(),
  venueId:    uuid('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  userId:     uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action:     text('action').notNull(), // e.g. 'sale.created', 'expense.deleted'
  tableName:  text('table_name').notNull(),
  recordId:   uuid('record_id').notNull(),
  oldData:    jsonb('old_data'),
  newData:    jsonb('new_data'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('audit_logs_venue_idx').on(t.venueId),
  index('audit_logs_created_at_idx').on(t.createdAt),
])

// ── Employees ─────────────────────────────────────────────────────────────────

export const employees = pgTable('employees', {
  id:            uuid('id').primaryKey().defaultRandom(),
  venueId:       uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  fullName:      text('full_name').notNull(),
  role:          text('role').notNull().default('Staff'),
  payType:       payTypeEnum('pay_type').notNull().default('daily'),
  payRate:       integer('pay_rate').notNull().default(0), // cents — per day (daily) or per month (monthly)
  startDate:     date('start_date').notNull(),
  isActive:      boolean('is_active').notNull().default(true),
  contactNumber: text('contact_number'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('employees_venue_idx').on(t.venueId)])

// ── Payroll Runs ──────────────────────────────────────────────────────────────

export const payrollRuns = pgTable('payroll_runs', {
  id:              uuid('id').primaryKey().defaultRandom(),
  venueId:         uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  periodStart:     date('period_start').notNull(),
  periodEnd:       date('period_end').notNull(),
  totalGross:      integer('total_gross').notNull().default(0),      // cents
  totalDeductions: integer('total_deductions').notNull().default(0), // cents
  totalNet:        integer('total_net').notNull().default(0),        // cents
  note:            text('note'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('payroll_runs_venue_idx').on(t.venueId)])

// ── Payroll Items ─────────────────────────────────────────────────────────────

export const payrollItems = pgTable('payroll_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  payrollRunId: uuid('payroll_run_id').notNull().references(() => payrollRuns.id, { onDelete: 'cascade' }),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
  daysWorked:   numeric('days_worked', { precision: 6, scale: 2 }).notNull().default('0'),
  grossPay:     integer('gross_pay').notNull().default(0),  // cents
  deductions:   integer('deductions').notNull().default(0), // cents
  netPay:       integer('net_pay').notNull().default(0),    // cents
  note:         text('note'),
}, (t) => [
  index('payroll_items_run_idx').on(t.payrollRunId),
  index('payroll_items_employee_idx').on(t.employeeId),
])

// ── Waste Logs ────────────────────────────────────────────────────────────────

export const wasteLogs = pgTable('waste_logs', {
  id:             uuid('id').primaryKey().defaultRandom(),
  venueId:        uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId:         uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  ingredientId:   uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  ingredientName: text('ingredient_name').notNull(), // snapshot in case ingredient is later deleted
  qty:            numeric('qty', { precision: 12, scale: 4 }).notNull(),
  unit:           text('unit').notNull(),
  reason:         wasteReasonEnum('reason').notNull().default('other'),
  estimatedCost:  integer('estimated_cost').notNull().default(0), // cents
  note:           text('note'),
  wastedAt:       date('wasted_at').notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('waste_logs_venue_idx').on(t.venueId),
  index('waste_logs_date_idx').on(t.wastedAt),
])

// ── Relations ─────────────────────────────────────────────────────────────────

export const accountsRelations = relations(accounts, ({ many }) => ({
  users:  many(users),
  venues: many(venues),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  account:   one(accounts, { fields: [users.accountId], references: [accounts.id] }),
  sales:     many(sales),
  expenses:  many(expenses),
  wasteLogs: many(wasteLogs),
}))

export const venuesRelations = relations(venues, ({ one, many }) => ({
  account:      one(accounts, { fields: [venues.accountId], references: [accounts.id] }),
  ingredients:  many(ingredients),
  dishes:       many(dishes),
  sales:        many(sales),
  expenses:     many(expenses),
  employees:    many(employees),
  payrollRuns:  many(payrollRuns),
  wasteLogs:    many(wasteLogs),
}))

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  venue:       one(venues, { fields: [ingredients.venueId], references: [venues.id] }),
  recipeItems: many(recipeItems),
  wasteLogs:   many(wasteLogs),
}))

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  venue:       one(venues, { fields: [dishes.venueId], references: [venues.id] }),
  recipeItems: many(recipeItems),
  saleItems:   many(saleItems),
}))

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  dish:       one(dishes, { fields: [recipeItems.dishId], references: [dishes.id] }),
  ingredient: one(ingredients, { fields: [recipeItems.ingredientId], references: [ingredients.id] }),
}))

export const salesRelations = relations(sales, ({ one, many }) => ({
  venue:     one(venues, { fields: [sales.venueId], references: [venues.id] }),
  user:      one(users, { fields: [sales.userId], references: [users.id] }),
  saleItems: many(saleItems),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  dish: one(dishes, { fields: [saleItems.dishId], references: [dishes.id] }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  venue: one(venues, { fields: [expenses.venueId], references: [venues.id] }),
  user:  one(users, { fields: [expenses.userId], references: [users.id] }),
}))

export const employeesRelations = relations(employees, ({ one, many }) => ({
  venue:        one(venues, { fields: [employees.venueId], references: [venues.id] }),
  payrollItems: many(payrollItems),
}))

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  venue: one(venues, { fields: [payrollRuns.venueId], references: [venues.id] }),
  items: many(payrollItems),
}))

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  payrollRun: one(payrollRuns, { fields: [payrollItems.payrollRunId], references: [payrollRuns.id] }),
  employee:   one(employees, { fields: [payrollItems.employeeId], references: [employees.id] }),
}))

export const wasteLogsRelations = relations(wasteLogs, ({ one }) => ({
  venue:      one(venues, { fields: [wasteLogs.venueId], references: [venues.id] }),
  ingredient: one(ingredients, { fields: [wasteLogs.ingredientId], references: [ingredients.id] }),
  user:       one(users, { fields: [wasteLogs.userId], references: [users.id] }),
}))
