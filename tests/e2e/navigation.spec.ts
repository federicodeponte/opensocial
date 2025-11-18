// ABOUTME: E2E tests for navigation and page loads
// ABOUTME: Tests routing, page accessibility, and responsive design

import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login or show home
    await expect(page).toHaveURL(/\/login|\/home|\//)
    await expect(page.locator('h1, h2')).toBeVisible()
  })

  test('should navigate to explore page', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto('/explore')

    // Should show explore page
    await expect(page.locator('h1')).toContainText(/explore/i)
    await expect(page.locator('text=/trending|for you/i')).toBeVisible()
  })

  test('should display trending hashtags', async ({ page }) => {
    await page.goto('/explore')

    // Should show trending section
    await expect(page.locator('text=/trending/i')).toBeVisible()

    // Should have tabs
    await expect(page.locator('[role="tab"]')).toHaveCount(4, { timeout: 5000 })
  })

  test('should switch between explore tabs', async ({ page }) => {
    await page.goto('/explore')

    // Click on different tabs
    await page.click('text=/trending/i')
    await expect(page.locator('text=/trending posts/i')).toBeVisible()

    await page.click('text=/people/i')
    await expect(page.locator('text=/who to follow|suggested/i')).toBeVisible()

    await page.click('text=/hashtags/i')
    await expect(page.locator('text=/trending hashtags/i')).toBeVisible()
  })

  test('should search for users', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto('/home')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.waitFor({ state: 'visible' })

    // Type search query
    await searchInput.fill('test')

    // Should show search results
    await expect(page.locator('[data-testid="search-result"]')).toBeVisible({ timeout: 3000 })
  })

  test('should navigate to user profile', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto('/home')

    // Click on a username or avatar
    const username = page.locator('[data-testid="username"]').first()
    await username.click()

    // Should navigate to profile page
    await expect(page).toHaveURL(/\/profile\//)
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible()
  })

  test('should display profile with tabs', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto(`/profile/${process.env.TEST_USERNAME || 'testuser'}`)

    // Should show profile tabs
    await expect(page.locator('[role="tab"]')).toHaveCount(3, { timeout: 5000 })

    // Should have posts, replies, media tabs
    await expect(page.locator('text=/posts/i')).toBeVisible()
    await expect(page.locator('text=/replies/i')).toBeVisible()
    await expect(page.locator('text=/media|likes/i')).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/home')

    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"]').or(
      page.locator('button:has-text("Dark"), button:has-text("Light")')
    )

    // Get initial theme
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')

    // Toggle theme
    await themeToggle.click()

    // Wait for theme to change
    await page.waitForTimeout(500)

    // Class should have changed
    const newClass = await html.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/home')

    // Should still display main content
    await expect(page.locator('main, [role="main"]')).toBeVisible()

    // Mobile menu should be accessible
    const menuButton = page.locator('button[aria-label*="Menu"]')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await expect(page.locator('[role="navigation"]')).toBeVisible()
    }
  })

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    // Should show 404 page or redirect
    const content = await page.textContent('body')
    expect(content).toMatch(/404|not found/i)
  })

  test('should load profile page with correct data', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto(`/profile/${process.env.TEST_USERNAME || 'testuser'}`)

    // Should show profile information
    await expect(page.locator('[data-testid="display-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="username"]')).toBeVisible()
    await expect(page.locator('text=/followers|following/i')).toBeVisible()
  })
})
