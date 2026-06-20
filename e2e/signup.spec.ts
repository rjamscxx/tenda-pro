import { test, expect } from '@playwright/test'

// Signup smoke: verifies the signup page and form render correctly.
// Full flow (signup → email confirm → trial dashboard) requires:
//   E2E_SIGNUP_EMAIL, E2E_SIGNUP_PASSWORD, and Supabase email confirmation
//   disabled in the test project. Skip those tests in CI by default.

const SIGNUP_EMAIL = process.env.E2E_SIGNUP_EMAIL ?? ''
const SIGNUP_PASSWORD = process.env.E2E_SIGNUP_PASSWORD ?? ''

test.describe('signup page', () => {
  test('signup page loads and form renders', async ({ page }) => {
    await page.goto('/signup')

    // Heading visible
    await expect(page.getByText(/start for free/i)).toBeVisible()

    // Required fields present
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
  })

  test('shows validation state for invalid email', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByLabel(/password/i).first().fill('password123')
    await page.getByRole('button', { name: /create account|sign up|get started/i }).click()

    // Either browser native validation or app error message should appear
    // (Supabase returns an error for invalid email format)
    const emailInput = page.getByLabel(/email/i)
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    )
    const appError = page.getByText(/valid email|invalid.*email|email.*invalid/i)
    const hasAppError = await appError.isVisible().catch(() => false)

    expect(isInvalid || hasAppError).toBe(true)
  })
})

test.describe('signup flow (requires live Supabase test account)', () => {
  test.skip(!SIGNUP_EMAIL || !SIGNUP_PASSWORD, 'E2E_SIGNUP_EMAIL and E2E_SIGNUP_PASSWORD must be set')

  test('signup → confirmation state reached', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/email/i).fill(SIGNUP_EMAIL)
    await page.getByLabel(/password/i).first().fill(SIGNUP_PASSWORD)
    await page.getByRole('button', { name: /create account|sign up|get started/i }).click()

    // Either: email confirmation required → "check your email" message
    //     OR: email confirmation disabled → redirect to /onboarding
    const emailSent = page.getByText(/check your email|verify your email|confirmation/i)
    const onboarding = page.url().includes('/onboarding')

    const confirmed = await emailSent.isVisible({ timeout: 10_000 }).catch(() => false)
    expect(confirmed || onboarding).toBe(true)
  })
})
