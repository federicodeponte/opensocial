# Testing Guide

Comprehensive testing documentation for OpenSocial.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── auth.spec.ts       # Authentication flows
│   ├── posts.spec.ts      # Post creation and interactions
│   └── navigation.spec.ts # Navigation and routing
├── integration/           # Integration tests (future)
└── unit/                  # Unit tests (future)
```

---

## End-to-End Tests (Playwright)

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (recommended for development)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Test Environment Setup

**Required Environment Variables:**

Create `.env.test`:
```bash
# Test user credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=testpassword123
TEST_USERNAME=testuser

# Test image (optional)
TEST_IMAGE_PATH=/path/to/test-image.jpg

# Set node environment
NODE_ENV=test
```

**Test Database:**

Use a separate Supabase project for testing:
```bash
# Test environment variables
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
```

---

## Writing E2E Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  // Run before each test
  test.beforeEach(async ({ page }) => {
    // Setup code (e.g., login)
  })

  // Run after each test
  test.afterEach(async ({ page }) => {
    // Cleanup code
  })

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/path')
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

### Best Practices

**1. Use data-testid attributes:**
```tsx
// In components
<button data-testid="submit-button">Submit</button>

// In tests
await page.click('[data-testid="submit-button"]')
```

**2. Wait for network idle:**
```typescript
await page.goto('/path', { waitUntil: 'networkidle' })
```

**3. Use explicit waits:**
```typescript
await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 })
```

**4. Handle flaky tests:**
```typescript
// Use retry
test.describe.configure({ retries: 2 })

// Or custom timeout
await expect(element).toBeVisible({ timeout: 10000 })
```

**5. Skip tests conditionally:**
```typescript
test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment')
```

---

## Test Coverage

### Current Coverage

**E2E Tests:**
- ✅ Authentication (login, signup, validation)
- ✅ Post creation and deletion
- ✅ Post interactions (like, unlike, retweet)
- ✅ Replies and comments
- ✅ Navigation between pages
- ✅ Explore page and trending
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ Search functionality
- ✅ Profile pages

### Missing Coverage (Future)

**Unit Tests:**
- [ ] Utility functions
- [ ] Algorithms (trending score, recommendations)
- [ ] Data transformations
- [ ] Validation functions

**Integration Tests:**
- [ ] API routes
- [ ] Database queries
- [ ] Authentication flows
- [ ] File uploads

**Performance Tests:**
- [ ] Load testing
- [ ] Stress testing
- [ ] Query performance benchmarks

---

## Visual Regression Testing

### Setup Playwright Visual Comparisons

```typescript
test('visual regression test', async ({ page }) => {
  await page.goto('/home')

  // Take screenshot and compare
  await expect(page).toHaveScreenshot('home-page.png')
})
```

### Update Snapshots

```bash
# Update all snapshots
npx playwright test --update-snapshots

# Update specific test
npx playwright test auth.spec.ts --update-snapshots
```

---

## Debugging Tests

### Playwright Inspector

```bash
# Run with inspector
npx playwright test --debug

# Or in specific test
npx playwright test auth.spec.ts --debug
```

### Trace Viewer

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots on Failure

```typescript
// In playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Manual Testing Checklist

### Pre-Release Testing

**Authentication:**
- [ ] Sign up with new account
- [ ] Log in with existing account
- [ ] Log out
- [ ] Invalid credentials show error
- [ ] Session persists after refresh

**Post Creation:**
- [ ] Create text post
- [ ] Create post with image
- [ ] Create post with GIF
- [ ] Create post with link (preview shows)
- [ ] Create poll
- [ ] Schedule post
- [ ] Delete own post
- [ ] Character limit enforced

**Interactions:**
- [ ] Like post
- [ ] Unlike post
- [ ] Retweet post
- [ ] Unretweet post
- [ ] Reply to post
- [ ] Quote tweet
- [ ] Bookmark post
- [ ] View post thread

**Profile:**
- [ ] View own profile
- [ ] View other user profile
- [ ] Edit profile
- [ ] Upload avatar
- [ ] Upload header image
- [ ] Follow user
- [ ] Unfollow user
- [ ] View followers list
- [ ] View following list

**Discovery:**
- [ ] Search for users
- [ ] Search for posts
- [ ] Search for hashtags
- [ ] View trending posts
- [ ] View trending hashtags
- [ ] View who to follow suggestions
- [ ] Browse explore page

**UI/UX:**
- [ ] Dark mode toggle works
- [ ] Animations smooth (60fps)
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Empty states helpful
- [ ] Mobile responsive
- [ ] Infinite scroll works
- [ ] Images lazy load

**Performance:**
- [ ] Page loads < 2s
- [ ] API calls < 200ms
- [ ] No console errors
- [ ] No memory leaks
- [ ] Images optimized
- [ ] Lighthouse score > 90

---

## Performance Testing

### Lighthouse Audit

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Check specific metrics
npx lighthouse http://localhost:3000 \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-results.json
```

### Load Testing

```bash
# Using Artillery (install first: npm i -g artillery)
artillery quick --count 100 --num 10 http://localhost:3000
```

---

## Accessibility Testing

### Automated Checks

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/home')

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

### Manual Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Forms have labels
- [ ] Images have alt text

---

## Test Maintenance

### When to Update Tests

1. **After feature changes** - Update affected tests
2. **Before releases** - Run full test suite
3. **After bug fixes** - Add regression tests
4. **UI changes** - Update visual snapshots

### Test Quality Checklist

- [ ] Tests are independent (no dependencies between tests)
- [ ] Tests are deterministic (same result every time)
- [ ] Tests are fast (< 30s per test)
- [ ] Tests are readable (clear intent)
- [ ] Tests use data-testid selectors
- [ ] Tests handle async properly
- [ ] Tests clean up after themselves

---

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase timeout: `{ timeout: 10000 }`
- Check if app is running
- Verify network requests complete

**Flaky tests:**
- Add explicit waits
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded delays

**Element not found:**
- Check selector
- Verify element is in DOM
- Wait for element to appear
- Check if element is in shadow DOM

**Authentication issues:**
- Verify test credentials
- Check test database
- Clear cookies between tests

---

## Resources

**Playwright Documentation:**
- https://playwright.dev/docs/intro
- https://playwright.dev/docs/best-practices

**Testing Best Practices:**
- https://martinfowler.com/articles/practical-test-pyramid.html
- https://testing-library.com/docs/guiding-principles

**Accessibility Testing:**
- https://www.w3.org/WAI/test-evaluate/
- https://web.dev/accessibility/

---

## Next Steps

1. **Run test suite** - Verify all tests pass
2. **Add more tests** - Increase coverage
3. **Set up CI/CD** - Automate testing
4. **Performance testing** - Load and stress tests
5. **Accessibility audit** - WCAG compliance

🧪 **Happy Testing!**
