// ABOUTME: E2E tests for post creation and interactions
// ABOUTME: Tests creating posts, liking, replying, and deleting

import { test, expect } from '@playwright/test'

test.describe('Posts', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    // Skip tests if not in test environment
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')

    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test@example.com')
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/home|\/feed|\//, { timeout: 10000 })
  })

  test('should display post composer', async ({ page }) => {
    await page.goto('/home')

    // Check if post composer is visible
    await expect(page.locator('textarea[placeholder*="What"]')).toBeVisible()
    await expect(page.locator('button:has-text("Post")')).toBeVisible()
  })

  test('should create a new post', async ({ page }) => {
    await page.goto('/home')

    const postContent = `Test post ${Date.now()}`

    // Fill post composer
    await page.fill('textarea[placeholder*="What"]', postContent)

    // Submit post
    await page.click('button:has-text("Post")')

    // Should see success message or new post in feed
    await expect(
      page.locator(`text=${postContent}`).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should not allow empty posts', async ({ page }) => {
    await page.goto('/home')

    // Try to submit empty post
    await page.click('button:has-text("Post")')

    // Post button should be disabled or show error
    const postButton = page.locator('button:has-text("Post")')
    await expect(postButton).toBeDisabled()
  })

  test('should enforce character limit', async ({ page }) => {
    await page.goto('/home')

    const longText = 'a'.repeat(281) // Over 280 char limit

    // Fill post composer
    await page.fill('textarea[placeholder*="What"]', longText)

    // Should show character count warning
    await expect(page.locator('text=/280|character|limit/i')).toBeVisible()

    // Post button should be disabled
    const postButton = page.locator('button:has-text("Post")')
    await expect(postButton).toBeDisabled()
  })

  test('should like a post', async ({ page }) => {
    await page.goto('/home')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 })

    // Get initial like count
    const likeButton = page.locator('button[aria-label*="Like"]').first()
    await likeButton.waitFor({ state: 'visible' })

    // Click like button
    await likeButton.click()

    // Should see liked state (red heart or increased count)
    await expect(
      page.locator('[aria-label*="Unlike"]').first()
    ).toBeVisible({ timeout: 3000 })
  })

  test('should unlike a post', async ({ page }) => {
    await page.goto('/home')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 })

    // Like a post first
    const likeButton = page.locator('button[aria-label*="Like"]').first()
    await likeButton.click()
    await page.waitForTimeout(500)

    // Unlike the post
    const unlikeButton = page.locator('button[aria-label*="Unlike"]').first()
    await unlikeButton.click()

    // Should return to unliked state
    await expect(
      page.locator('button[aria-label*="Like"]').first()
    ).toBeVisible({ timeout: 3000 })
  })

  test('should reply to a post', async ({ page }) => {
    await page.goto('/home')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 })

    // Click reply button
    const replyButton = page.locator('button[aria-label*="Reply"]').first()
    await replyButton.click()

    // Should open reply modal or composer
    await expect(page.locator('textarea[placeholder*="reply"]')).toBeVisible()

    // Type reply
    const replyContent = `Reply ${Date.now()}`
    await page.fill('textarea[placeholder*="reply"]', replyContent)

    // Submit reply
    await page.click('button:has-text("Reply")')

    // Should see reply in thread
    await expect(page.locator(`text=${replyContent}`)).toBeVisible({ timeout: 5000 })
  })

  test('should retweet a post', async ({ page }) => {
    await page.goto('/home')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 })

    // Click retweet button
    const retweetButton = page.locator('button[aria-label*="Retweet"]').first()
    await retweetButton.click()

    // Should see retweeted state
    await expect(
      page.locator('[aria-label*="Unretweet"]').first()
    ).toBeVisible({ timeout: 3000 })
  })

  test('should delete own post', async ({ page }) => {
    await page.goto('/home')

    // Create a post first
    const postContent = `Post to delete ${Date.now()}`
    await page.fill('textarea[placeholder*="What"]', postContent)
    await page.click('button:has-text("Post")')
    await page.waitForTimeout(1000)

    // Find the post
    const post = page.locator(`text=${postContent}`).first()
    await post.waitFor({ state: 'visible' })

    // Open post menu
    await post.locator('..').locator('button[aria-label*="More"]').click()

    // Click delete
    await page.click('text=/delete/i')

    // Confirm deletion
    await page.click('button:has-text("Delete")')

    // Post should be removed
    await expect(post).not.toBeVisible({ timeout: 3000 })
  })

  test('should display post with image', async ({ page }) => {
    // Skip if no test images available
    test.skip(!process.env.TEST_IMAGE_PATH, 'Requires test image')

    await page.goto('/home')

    // Click image upload button
    await page.click('button[aria-label*="Add photo"]')

    // Upload image
    await page.setInputFiles('input[type="file"]', process.env.TEST_IMAGE_PATH!)

    // Should show image preview
    await expect(page.locator('img[alt*="Upload preview"]')).toBeVisible()

    // Add text and submit
    await page.fill('textarea[placeholder*="What"]', 'Post with image')
    await page.click('button:has-text("Post")')

    // Should see post with image
    await expect(
      page.locator('text=Post with image').locator('..').locator('img')
    ).toBeVisible({ timeout: 5000 })
  })
})
