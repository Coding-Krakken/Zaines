import { test, expect } from '@playwright/test'

test.describe('Dashboard access', () => {
  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*\/auth\/signin/)
  })
})
