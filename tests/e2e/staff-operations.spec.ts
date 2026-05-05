import { test, expect } from '@playwright/test'

const BASE = process.env.E2E_BASE || ''

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WfY2D0AAAAASUVORK5CYII=',
  'base64',
)

test.describe('Staff operations flow', () => {
  test('check-in -> activity -> photo -> check-out', async ({ context, page }) => {
    const activities: Array<Record<string, unknown>> = []
    const photos: Array<Record<string, unknown>> = []

    await context.addCookies([
      {
        name: 'e2e-staff',
        value: '1',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.route('**/api/admin/bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bookings: [
            {
              id: 'book-1',
              bookingNumber: 'PB-001',
              status: 'checked_in',
              checkInDate: new Date().toISOString(),
              checkOutDate: new Date().toISOString(),
              user: { name: 'Alice', email: 'alice@example.com' },
              suite: { name: 'Suite 101' },
              bookingPets: [{ pet: { id: 'pet-1', name: 'Rex', breed: 'Lab' } }],
            },
          ],
        }),
      })
    })

    await page.route('**/api/admin/check-in', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ booking: { id: 'book-1', status: 'checked_in' } }),
      })
    })

    await page.route('**/api/admin/check-out', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ booking: { id: 'book-1', status: 'completed' } }),
      })
    })

    await page.route('**/api/admin/activities**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activities }),
        })
        return
      }

      const payload = route.request().postDataJSON() as {
        type: string
        description?: string
        notes?: string
      }

      const activity = {
        id: `act-${activities.length + 1}`,
        type: payload.type,
        description: payload.description ?? null,
        notes: payload.notes ?? null,
        performedBy: 'Staff E2E',
        performedAt: new Date().toISOString(),
        pet: { id: 'pet-1', name: 'Rex', breed: 'Lab' },
        booking: { id: 'book-1', bookingNumber: 'PB-001', status: 'checked_in' },
      }

      activities.unshift(activity)
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ activity }),
      })
    })

    await page.route('**/api/admin/photos**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photos }),
        })
        return
      }

      const photo = {
        id: `photo-${photos.length + 1}`,
        imageUrl: '/uploads/pet-photos/e2e-mock.jpg',
        caption: 'Happy pup',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Staff E2E',
        pet: { id: 'pet-1', name: 'Rex', breed: 'Lab' },
        booking: { id: 'book-1', bookingNumber: 'PB-001', status: 'checked_in' },
      }

      photos.unshift(photo)
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ photo }),
      })
    })

    await page.goto(`${BASE}/admin/check-in/book-1`)
    await page.getByRole('button', { name: 'Confirm Check-In' }).click()
    await expect(page.getByText('Guest successfully checked in.')).toBeVisible()

    await page.goto(`${BASE}/admin/activities?bookingId=book-1`)
    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: /PB-001/ }).click()
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Rex/ }).click()
    await page.getByPlaceholder('Quick summary').fill('Morning walk complete')
    await expect(page.getByRole('button', { name: 'Log Activity' })).toBeEnabled()
    await page.getByRole('button', { name: 'Log Activity' }).click()
    await expect(page.getByText('Activity logged.')).toBeVisible()

    await page.goto(`${BASE}/admin/photos?bookingId=book-1`)
    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: /PB-001/ }).click()
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Rex/ }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'pet.png',
      mimeType: 'image/png',
      buffer: PNG_1X1,
    })
    await page.getByPlaceholder('Quick update for the owner').fill('Happy pup')
    await expect(page.getByRole('button', { name: 'Upload Photo' })).toBeEnabled()
    await page.getByRole('button', { name: 'Upload Photo' }).click()
    await expect(page.getByText('Photo uploaded.')).toBeVisible()

    await page.goto(`${BASE}/admin/check-out/book-1`)
    await page.getByRole('button', { name: 'Confirm Check-Out' }).click()
    await expect(page.getByText('Guest successfully checked out.')).toBeVisible()
  })
})
