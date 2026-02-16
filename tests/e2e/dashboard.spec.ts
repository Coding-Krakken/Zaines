import { test, expect } from '@playwright/test'

const BASE = process.env.E2E_BASE || ''

test.describe('Dashboard access', () => {
  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/.*\/auth\/signin/)
  })
})
