import { test, expect } from '@playwright/test'

// Requires env vars: E2E_EMAIL, E2E_PASSWORD (a real test account)
const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

test.describe('auth smoke', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL and E2E_PASSWORD must be set')

  test('login → dashboard renders', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill(EMAIL)
    await page.getByLabel(/password/i).fill(PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Dashboard layout renders: sidebar nav should be visible
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15_000 })

    // URL should leave /login
    await expect(page).not.toHaveURL(/\/login/)
  })
})
