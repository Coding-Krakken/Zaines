import { expect, test } from '@playwright/test';

test.describe('Admin finance workflows', () => {
  test('overview, refund, reconciliation, and tax pages work end-to-end', async ({ context, page }) => {
    test.setTimeout(120_000);

    await context.addCookies([
      {
        name: 'e2e-staff',
        value: '1',
        domain: 'localhost',
        path: '/',
      },
    ]);

    const auditEvents: Array<Record<string, unknown>> = [
      {
        id: 'audit-1',
        bookingId: 'booking-1',
        actorName: 'Admin User',
        actorUserId: 'admin-1',
        eventType: 'REFUND_APPLIED',
        note: 'Initial refund',
        payload: {},
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/admin/finance/overview**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
            totals: {
              grossRevenue: 1200,
              refunds: 100,
              netRevenue: 1100,
              taxesCollected: 90,
              outstandingPending: 40,
              transactionCount: 6,
            },
            byStatus: [
              { status: 'succeeded', count: 4, amount: 1200 },
              { status: 'refunded', count: 1, amount: 100 },
              { status: 'pending', count: 1, amount: 40 },
              { status: 'failed', count: 0, amount: 0 },
              { status: 'cancelled', count: 0, amount: 0 },
            ],
          },
        }),
      });
    });

    await page.route('**/api/admin/finance/transactions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
            summary: {
              totalTransactions: 1,
              filteredTransactions: 1,
              totalAmount: 300,
              totalRefundAmount: 0,
            },
            rows: [
              {
                id: 'payment-1',
                bookingId: 'booking-1',
                bookingNumber: 'PB-001',
                customerName: 'Alice',
                customerEmail: 'alice@example.com',
                amount: 300,
                refundAmount: 0,
                currency: 'USD',
                status: 'succeeded',
                paymentMethod: 'card',
                stripePaymentId: 'pi_1',
                createdAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                refundedAt: null,
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/admin/finance/refunds**', async (route) => {
      if (route.request().method() === 'POST') {
        auditEvents.unshift({
          id: 'audit-refund',
          bookingId: 'booking-1',
          actorName: 'Admin User',
          actorUserId: 'admin-1',
          eventType: 'REFUND_APPLIED',
          note: 'Customer requested',
          payload: {},
          createdAt: new Date().toISOString(),
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'payment-1' } }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
            summary: {
              totalTransactions: 1,
              filteredTransactions: 1,
              totalAmount: 300,
              totalRefundAmount: 0,
            },
            rows: [
              {
                id: 'payment-1',
                bookingId: 'booking-1',
                bookingNumber: 'PB-001',
                customerName: 'Alice',
                customerEmail: 'alice@example.com',
                amount: 300,
                refundAmount: 0,
                currency: 'USD',
                status: 'succeeded',
                paymentMethod: 'card',
                stripePaymentId: 'pi_1',
                createdAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                refundedAt: null,
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/admin/finance/adjustments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'credit-1' } }),
      });
    });

    await page.route('**/api/admin/finance/audit**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: auditEvents }),
      });
    });

    await page.route('**/api/admin/finance/reconciliation**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
            totals: {
              succeededAmount: 1200,
              refundedAmount: 100,
              netAmount: 1100,
              transactionCount: 5,
            },
            buckets: [
              {
                date: '2026-05-08',
                succeededAmount: 1200,
                refundedAmount: 100,
                netAmount: 1100,
                transactionCount: 5,
                status: 'pending',
                reconciledAt: null,
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/admin/finance/taxes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
            totals: {
              taxableRevenue: 1200,
              taxCollected: 90,
              refundedTax: 10,
              netTaxLiability: 80,
            },
            rows: [
              {
                period: '2026-05',
                taxableRevenue: 1200,
                taxCollected: 90,
                refundedTax: 10,
                netTaxLiability: 80,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/admin/finance', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Finance' })).toBeVisible();
    await expect(page.getByText('Gross Revenue')).toBeVisible();

    await page.getByRole('link', { name: 'Open Refund Console' }).click();
    await expect(page.getByRole('heading', { name: 'Refund Console' })).toBeVisible();
    await page.locator('input[placeholder="0.00"]').first().fill('10');
    await page.locator('input[placeholder="Reason"]').first().fill('Customer requested');
    await page.getByRole('button', { name: 'Apply Refund' }).first().click();
    await expect(page.getByText('Refund applied successfully.')).toBeVisible();

    await page.getByPlaceholder('Booking ID').fill('booking-1');
    await page.getByPlaceholder('Amount').fill('5');
    await page.getByPlaceholder('Reason').last().fill('Manual correction');
    await page.getByRole('button', { name: 'Apply Adjustment' }).click();
    await expect(page.getByText('Manual adjustment recorded successfully.')).toBeVisible();

    await page.getByRole('link', { name: 'Back to Finance' }).click();
    await page.getByRole('link', { name: 'Open Reconciliation' }).click();
    await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible();
    await page.getByRole('button', { name: 'Mark Reconciled' }).click();

    await page.getByRole('link', { name: 'Back to Finance' }).click();
    await page.getByRole('link', { name: 'Open Tax Summary' }).click();
    await expect(page.getByRole('heading', { name: 'Tax Liability' })).toBeVisible();

    const exportLink = page.getByRole('link', { name: 'Export CSV' });
    await expect(exportLink).toHaveAttribute('href', /\/api\/admin\/finance\/taxes\/export/);
  });
});
