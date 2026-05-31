'use server'

import { db } from '@/lib/db'
import { accounts, users, venues, ingredients, dishes, recipeItems, sales, saleItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface CreateVenueInput {
  userId:    string
  venueName: string
  fullName:  string
  theme:     string
  withDemo?: boolean
}

export async function createVenue({ userId, venueName, fullName, theme, withDemo }: CreateVenueInput) {
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (existing.length > 0) redirect('/dashboard')

  let venueId: string | undefined

  try {
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)
    const [account] = await db.insert(accounts).values({
      plan: 'pro',
      trialStartedAt: new Date(),
      planExpiresAt: trialEnd,
    }).returning()
    await db.insert(users).values({
      id:        userId,
      accountId: account.id,
      role:      'owner',
      fullName:  fullName.trim() || null,
    })
    const [venue] = await db.insert(venues).values({
      accountId: account.id,
      name:      venueName.trim(),
    }).returning()
    venueId = venue.id
  } catch (err) {
    console.error('createVenue error:', err)
    return { error: 'Something went wrong. Please try again.' }
  }

  if (withDemo && venueId) {
    try {
      await seedDemoData(venueId)
    } catch (err) {
      console.error('seedDemoData error (non-fatal):', err)
    }
  }

  const cookieStore = await cookies()
  cookieStore.set('sizzle-theme', theme, {
    path:     '/',
    maxAge:   31536000,
    sameSite: 'lax',
  })

  redirect('/dashboard')
}

async function seedDemoData(venueId: string) {
  // Ingredients
  const [coffee, milk, sugar, espressoShot, cream, butter, flour, eggs, pandesal, chocolatePowder] =
    await db.insert(ingredients).values([
      { venueId, name: 'Arabica Coffee Beans', unit: 'kg',     costPerUnit: 120000, stockQty: '2',    lowStockThreshold: '0.5'  },
      { venueId, name: 'Fresh Milk',           unit: 'L',      costPerUnit: 8000,   stockQty: '5',    lowStockThreshold: '1'    },
      { venueId, name: 'White Sugar',          unit: 'kg',     costPerUnit: 7000,   stockQty: '3',    lowStockThreshold: '0.5'  },
      { venueId, name: 'Espresso Shot',        unit: 'pcs',    costPerUnit: 1500,   stockQty: '50',   lowStockThreshold: '10'   },
      { venueId, name: 'All-Purpose Cream',    unit: 'mL',     costPerUnit: 15,     stockQty: '1000', lowStockThreshold: '200'  },
      { venueId, name: 'Butter',               unit: 'g',      costPerUnit: 15,     stockQty: '500',  lowStockThreshold: '100'  },
      { venueId, name: 'Bread Flour',          unit: 'kg',     costPerUnit: 5000,   stockQty: '5',    lowStockThreshold: '1'    },
      { venueId, name: 'Eggs',                 unit: 'pcs',    costPerUnit: 1200,   stockQty: '24',   lowStockThreshold: '6'    },
      { venueId, name: 'Pandesal Bread',       unit: 'pcs',    costPerUnit: 400,    stockQty: '30',   lowStockThreshold: '10'   },
      { venueId, name: 'Chocolate Powder',     unit: 'g',      costPerUnit: 10,     stockQty: '800',  lowStockThreshold: '150'  },
    ]).returning()

  // Dishes
  const [latte, cappuccino, coldBrew, mocha, pandesalSandwich, croissant] =
    await db.insert(dishes).values([
      { venueId, name: 'Café Latte',         category: 'Coffee',  price: 18000, isActive: true },
      { venueId, name: 'Cappuccino',         category: 'Coffee',  price: 16000, isActive: true },
      { venueId, name: 'Cold Brew',          category: 'Coffee',  price: 20000, isActive: true },
      { venueId, name: 'Mocha',              category: 'Coffee',  price: 20000, isActive: true },
      { venueId, name: 'Pandesal Sandwich',  category: 'Food',    price: 8000,  isActive: true },
      { venueId, name: 'Butter Croissant',   category: 'Food',    price: 12000, isActive: true },
    ]).returning()

  // Recipe items
  await db.insert(recipeItems).values([
    // Latte: 1 shot + 200mL milk
    { dishId: latte.id,          ingredientId: espressoShot.id,    qty: '1'   },
    { dishId: latte.id,          ingredientId: milk.id,            qty: '0.2' },
    { dishId: latte.id,          ingredientId: sugar.id,           qty: '0.01' },
    // Cappuccino: 1 shot + 120mL milk + 60mL cream
    { dishId: cappuccino.id,     ingredientId: espressoShot.id,    qty: '1'   },
    { dishId: cappuccino.id,     ingredientId: milk.id,            qty: '0.12' },
    { dishId: cappuccino.id,     ingredientId: cream.id,           qty: '60'  },
    // Cold Brew: 20g beans, cold steeped
    { dishId: coldBrew.id,       ingredientId: coffee.id,          qty: '0.02' },
    { dishId: coldBrew.id,       ingredientId: sugar.id,           qty: '0.01' },
    // Mocha: 1 shot + 200mL milk + 20g choc powder
    { dishId: mocha.id,          ingredientId: espressoShot.id,    qty: '1'   },
    { dishId: mocha.id,          ingredientId: milk.id,            qty: '0.2' },
    { dishId: mocha.id,          ingredientId: chocolatePowder.id, qty: '20'  },
    // Pandesal sandwich: 2 pandesal
    { dishId: pandesalSandwich.id, ingredientId: pandesal.id,      qty: '2'   },
    // Croissant: 80g flour + 30g butter + 1 egg
    { dishId: croissant.id,      ingredientId: flour.id,           qty: '0.08' },
    { dishId: croissant.id,      ingredientId: butter.id,          qty: '30'  },
    { dishId: croissant.id,      ingredientId: eggs.id,            qty: '1'   },
  ])

  // Demo sales (last 3 days)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2)

  await db.transaction(async (tx) => {
    const [sale1] = await tx.insert(sales).values({
      venueId, soldAt: twoDaysAgo, channel: 'dine_in',  total: 52000, isPaid: true,
    }).returning()
    await tx.insert(saleItems).values([
      { saleId: sale1.id, dishId: latte.id,        qty: 2, unitPrice: 18000, unitCost: 4500 },
      { saleId: sale1.id, dishId: cappuccino.id,   qty: 1, unitPrice: 16000, unitCost: 3800 },
    ])

    const [sale2] = await tx.insert(sales).values({
      venueId, soldAt: yesterday, channel: 'takeout', total: 74000, isPaid: true,
    }).returning()
    await tx.insert(saleItems).values([
      { saleId: sale2.id, dishId: coldBrew.id,     qty: 2, unitPrice: 20000, unitCost: 4000 },
      { saleId: sale2.id, dishId: mocha.id,        qty: 1, unitPrice: 20000, unitCost: 5500 },
      { saleId: sale2.id, dishId: pandesalSandwich.id, qty: 2, unitPrice: 8000, unitCost: 1200 },
    ])

    const [sale3] = await tx.insert(sales).values({
      venueId, soldAt: now, channel: 'dine_in', total: 62000, isPaid: true,
    }).returning()
    await tx.insert(saleItems).values([
      { saleId: sale3.id, dishId: latte.id,        qty: 2, unitPrice: 18000, unitCost: 4500 },
      { saleId: sale3.id, dishId: croissant.id,    qty: 2, unitPrice: 12000, unitCost: 3200 },
    ])
  })
}
