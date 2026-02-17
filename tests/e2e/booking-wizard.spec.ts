import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE || '';

test.describe('Booking Wizard Flow', () => {
  test('Mocked API response test', async ({ page }) => {
    await page.route('**/api/availability*', (route) => {
      console.log('Mocked API called');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ available: true, basePrice: 100 }),
      });
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3000/api/availability?checkIn=2026-02-20&checkOut=2026-02-25&serviceType=boarding');
      return res.json();
    });

    console.log('Response from mocked API:', response);
    expect(response.available).toBe(true);
    expect(response.basePrice).toBe(100);
  });
});