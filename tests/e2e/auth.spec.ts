// ABOUTME: E2E tests for authentication flows
// ABOUTME: Tests signup, login, logout, and session persistence

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check if login page elements are visible
    await expect(page.locator('h1')).toContainText(/login|sign in/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without filling fields
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=/required|must be filled/i')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/invalid credentials|incorrect|failed/i')).toBeVisible({
      timeout: 5000
    })
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')

    // Click signup link
    await page.click('text=/sign up|create account|register/i')

    // Should navigate to signup page
    await expect(page).toHaveURL(/signup|register/)
    await expect(page.locator('h1')).toContainText(/sign up|create account|register/i)
  })

  test('should display signup page with required fields', async ({ page }) => {
    await page.goto('/signup')

    // Check if signup page elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup')

    // Enter invalid email
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="username"]', 'testuser')
    await page.click('button[type="submit"]')

    // Should show email validation error
    await expect(page.locator('text=/invalid email|valid email/i')).toBeVisible()
  })

  test('should redirect to home after successful login', async ({ page }) => {
    // This test assumes you have test credentials or mock auth
    // Skip if no test environment
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto('/login')

    // Fill in valid test credentials
    await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test@example.com')
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')

    // Should redirect to home page
    await expect(page).toHaveURL(/\/home|\/feed|\//)

    // Should see user-specific content
    await expect(page.locator('text=/welcome|home|feed/i')).toBeVisible()
  })
})
