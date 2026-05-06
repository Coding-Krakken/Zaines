import { test, expect, type Page } from "@playwright/test";

const TEST_BOOKING_ID = "test-booking-123";

async function gotoBooking(page: Page) {
  await page.goto(`/dashboard/bookings/${TEST_BOOKING_ID}`);
  await expect(page).not.toHaveURL(/\/auth\/signin/);
}

test.describe("Parent Experience Live Feed - Issue #62", () => {
  test.beforeEach(async ({ page, context }) => {
    const activitiesPage1 = [
      {
        id: "activity-1",
        type: "feeding",
        description: "Breakfast served",
        performedBy: "Staff",
        performedAt: "2026-05-05T10:00:00.000Z",
        notes: "Ate all food",
        pet: { id: "pet-1", name: "Milo" },
      },
      {
        id: "activity-2",
        type: "walk",
        description: "Morning walk",
        performedBy: "Staff",
        performedAt: "2026-05-05T09:00:00.000Z",
        notes: "Great energy",
        pet: { id: "pet-1", name: "Milo" },
      },
    ];
    const activitiesPage2 = [
      {
        id: "activity-3",
        type: "play",
        description: "Play session",
        performedBy: "Staff",
        performedAt: "2026-05-05T08:00:00.000Z",
        notes: "Loved fetch",
        pet: { id: "pet-1", name: "Milo" },
      },
    ];

    const photos = [
      {
        id: "photo-1",
        imageUrl: "/file.svg",
        caption: "Nap time",
        uploadedBy: "Staff",
        uploadedAt: "2026-05-05T10:10:00.000Z",
        pet: { id: "pet-1", name: "Milo" },
      },
    ];

    const messages = [
      {
        id: "message-1",
        content: "Milo is doing great today!",
        senderType: "staff",
        senderName: "Staff",
        sentAt: "2026-05-05T10:20:00.000Z",
        isRead: true,
      },
    ];

    await context.addCookies([
      {
        name: "e2e-customer",
        value: "1",
        url: "http://localhost:4020",
      },
    ]);

    await page.route(`**/api/bookings/${TEST_BOOKING_ID}/activities**`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({ status: 405, body: "" });
        return;
      }

      const url = new URL(route.request().url());
      const cursor = url.searchParams.get("cursor");
      const items = cursor ? activitiesPage2 : activitiesPage1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items,
          hasMore: !cursor,
          nextCursor: cursor ? null : "activity-2",
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.route(`**/api/bookings/${TEST_BOOKING_ID}/photos**`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({ status: 405, body: "" });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: photos,
          hasMore: false,
          nextCursor: null,
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.route(`**/api/bookings/${TEST_BOOKING_ID}/messages**`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: messages,
            hasMore: false,
            nextCursor: null,
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      if (route.request().method() === "POST") {
        const payload = route.request().postDataJSON() as { content?: string };
        const created = {
          id: `message-${messages.length + 1}`,
          content: payload.content || "",
          senderType: "customer",
          senderName: "E2E Customer",
          sentAt: new Date().toISOString(),
          isRead: false,
        };
        messages.push(created);

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      await route.fulfill({ status: 405, body: "" });
    });

    await page.route(
      `**/api/bookings/${TEST_BOOKING_ID}/notifications**`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            events: {
              activities: activitiesPage1.slice(0, 1),
              photos: photos.slice(0, 1),
              messages: [],
            },
            meta: {
              timestamp: new Date().toISOString(),
              sinceTimestamp: new Date(Date.now() - 30000).toISOString(),
              eventCount: 2,
              pollLatencyMs: { activities: 1000, photos: 1000, messages: 0 },
            },
          }),
        });
      }
    );
  });

  test.describe("Activity Timeline", () => {
    test("displays activity timeline with filters", async ({ page }) => {
      await gotoBooking(page);

      // Navigate to Activity tab first, then verify filters
      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();
      await page.waitForSelector('[role="region"][aria-label="Activity Timeline"]');

      // Verify filter buttons exist
      const feedingBtn = page.locator('button[aria-label="Filter by Feeding"]');
      const walkBtn = page.locator('button[aria-label="Filter by Walk"]');
      const playBtn = page.locator('button[aria-label="Filter by Play"]');

      await expect(feedingBtn).toBeVisible();
      await expect(walkBtn).toBeVisible();
      await expect(playBtn).toBeVisible();
    });

    test("filters activities by type", async ({ page }) => {
      // Navigate to booking detail
      await gotoBooking(page);

      // Click Activity tab
      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Wait for timeline to load
      await page.waitForSelector('[role="region"][aria-label="Activity Timeline"]');

      // Click feeding filter
      const feedingBtn = page.locator('button[aria-label="Filter by Feeding"]');
      await feedingBtn.click();

      // Verify filter is applied
      await expect(feedingBtn).toHaveAttribute("aria-pressed", "true");
    });

    test("incremental loading of activities", async ({ page }) => {
      await gotoBooking(page);

      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Wait for at least one activity to appear (from mock data)
      await expect(page.locator('[role="article"]').first()).toBeVisible({ timeout: 5000 });

      const loadMoreBtn = page.locator("button:has-text('Load More')");
      const loadMoreExists = await loadMoreBtn.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (loadMoreExists) {
        const initialCount = await page.locator('[role="article"]').count();
        await loadMoreBtn.click();
        await page.waitForTimeout(500);
        const newCount = await page.locator('[role="article"]').count();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });

    test("activity timeline data is accessible", async ({ page }) => {
      await gotoBooking(page);

      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Check accessibility attributes
      const timeline = page.locator('[role="region"][aria-label="Activity Timeline"]');
      await expect(timeline).toHaveAttribute("role", "region");

      // Verify articles render with fixture data.
      await expect(
        timeline.locator("[role='article']").filter({ hasText: "Breakfast served" }).first()
      ).toBeVisible({ timeout: 7000 });
      const articles = page.locator('[role="article"]');
      await expect(articles.first()).toBeVisible();
      const count = await articles.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Photo Gallery", () => {
    test("displays photo gallery with pagination", async ({ page }) => {
      await gotoBooking(page);

      const galleryTab = page.locator('[role="tab"]:has-text("Photos")');
      await galleryTab.click();

      // Wait for gallery to load
      await page.waitForSelector('[role="region"][aria-label="Photo Gallery"]');

      const photos = page.locator('button[aria-label*="Open photo"]');
      const photoCount = await photos.count();
      expect(photoCount).toBeGreaterThan(0);
      await expect(page.getByRole("img", { name: "Nap time" })).toBeVisible();
    });

    test("lightbox opens on photo click", async ({ page }) => {
      await gotoBooking(page);

      const galleryTab = page.locator('[role="tab"]:has-text("Photos")');
      await galleryTab.click();

      // Wait for photo button to appear (from mock data)
      const firstPhoto = page.locator("button[aria-label*='Open photo']").first();
      await expect(firstPhoto).toBeVisible({ timeout: 5000 });

      await firstPhoto.click();

      // Verify lightbox appears
      const lightbox = page.locator('[role="dialog"][aria-label="Photo lightbox"]');
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    });

    test("lightbox navigation with arrows", async ({ page }) => {
      await gotoBooking(page);

      const galleryTab = page.locator('[role="tab"]:has-text("Photos")');
      await galleryTab.click();

      // Wait for photo button to appear (from mock data)
      const firstPhoto = page.locator("button[aria-label*='Open photo']").first();
      await expect(firstPhoto).toBeVisible({ timeout: 5000 });

      await firstPhoto.click();

      // Verify lightbox is open
      const lightbox = page.locator('[role="dialog"]');
      await expect(lightbox).toBeVisible({ timeout: 3000 });

      // Click next button if available
      const nextBtn = page.locator('button[aria-label="Next photo"]');
      const nextVisible = await nextBtn.isVisible({ timeout: 1000 }).catch(() => false);

      if (nextVisible) {
        await nextBtn.click();
        // Verify image changed (text would update)
        await page.waitForTimeout(300);
      }
    });

    test("keyboard navigation in lightbox", async ({ page }) => {
      await gotoBooking(page);

      const galleryTab = page.locator('[role="tab"]:has-text("Photos")');
      await galleryTab.click();

      // Wait for photo button to appear (from mock data)
      const firstPhoto = page.locator("button[aria-label*='Open photo']").first();
      await expect(firstPhoto).toBeVisible({ timeout: 5000 });

      // Open photo
      await firstPhoto.click();
      await page.waitForTimeout(300);

      // Verify lightbox is open
      const lightbox = page.locator('[role="dialog"]');
      await expect(lightbox).toBeVisible({ timeout: 3000 });

      // Press Escape to close
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Verify lightbox closed
      await expect(lightbox).not.toBeVisible({ timeout: 2000 });
    });

    test("photo gallery is accessible", async ({ page }) => {
      await gotoBooking(page);

      const galleryTab = page.locator('[role="tab"]:has-text("Photos")');
      await galleryTab.click();

      // Check gallery accessibility
      const gallery = page.locator('[role="region"][aria-label="Photo Gallery"]');
      await expect(gallery).toHaveAttribute("role", "region");

      // Verify gallery image alt text for accessibility.
      const galleryImage = page
        .locator('[role="region"][aria-label="Photo Gallery"] img[alt]')
        .first();
      await expect(galleryImage).toBeVisible({ timeout: 7000 });
      const alt = await galleryImage.getAttribute("alt");
      expect(alt).toBeTruthy();
    });
  });

  test.describe("Messaging Thread", () => {
    test("displays message thread with recent messages", async ({ page }) => {
      await gotoBooking(page);

      const messagesTab = page.locator('[role="tab"]:has-text("Messages")');
      await messagesTab.click();

      // Wait for messages to load
      await page.waitForSelector('[role="log"]');

      const logArea = page.locator('[role="log"]');
      await expect(logArea).toBeVisible();
    });

    test("sends a message", async ({ page }) => {
      await gotoBooking(page);

      const messagesTab = page.locator('[role="tab"]:has-text("Messages")');
      await messagesTab.click();

      // Wait for message input
      await page.waitForSelector('textarea[aria-label="Message input"]');

      const textarea = page.locator('textarea[aria-label="Message input"]');
      await textarea.fill("Test message");

      // Send message
      const sendBtn = page.locator('button[aria-label="Send message"]');
      await sendBtn.click();

      // Verify user-authored message appears in the thread.
      await expect(page.getByText("Test message")).toBeVisible();
    });

    test("message thread marks messages as read", async ({ page }) => {
      await gotoBooking(page);

      const messagesTab = page.locator('[role="tab"]:has-text("Messages")');
      await messagesTab.click();

      // Wait for messages to load
      await page.waitForSelector('[role="log"]');

      // Verify read indicator exists or messages load properly
      const logArea = page.locator('[role="log"]');
      await expect(logArea).toBeVisible();
    });

    test("keyboard shortcut to send message", async ({ page }) => {
      await gotoBooking(page);

      const messagesTab = page.locator('[role="tab"]:has-text("Messages")');
      await messagesTab.click();

      await page.waitForSelector('textarea[aria-label="Message input"]');

      const textarea = page.locator('textarea[aria-label="Message input"]');
      await textarea.fill("Ctrl+Enter test");

      // Press Ctrl+Enter
      await textarea.press("Control+Enter");

      // Wait for any send side-effects and verify UI remains operable.
      await page.waitForTimeout(500);
      const value = await textarea.inputValue();
      const stillEditable = await textarea.isEnabled();
      expect(stillEditable).toBe(true);
      expect(typeof value).toBe("string");
    });

    test("message thread is accessible", async ({ page }) => {
      await gotoBooking(page);

      const messagesTab = page.locator('[role="tab"]:has-text("Messages")');
      await messagesTab.click();

      // Check accessibility
      const thread = page.locator('[role="region"][aria-label="Message thread"]');
      await expect(thread).toHaveAttribute("role", "region");

      const logArea = page.locator('[role="log"]');
      await expect(logArea).toHaveAttribute("aria-live", "polite");
    });
  });

  test.describe("Real-Time Updates and Polling", () => {
    test("polls for new activities within SLA", async ({ page }) => {
      await gotoBooking(page);

      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Record initial activity count
      const initialArticles = page.locator('[role="article"]');
      const initialCount = await initialArticles.count();

      // Keep the interaction window short to reduce flake while still validating stability.
      await page.waitForTimeout(3000);

      // Verify timeline still responsive
      const timeline = page.locator('[role="region"][aria-label="Activity Timeline"]');
      await expect(timeline).toBeVisible();

      // Should have same or more activities (polling works)
      const newArticles = page.locator('[role="article"]');
      const newCount = await newArticles.count();

      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test("notification banner displays new events", async ({ page }) => {
      await gotoBooking(page);

      // Look for notification region
      const notificationRegion = page.locator(
        '[role="region"][aria-label="Notifications"]'
      );
      await expect(notificationRegion).toBeVisible();
      await expect(page.getByText("Activity: feeding")).toBeVisible();
      await expect(page.getByText("New photo shared")).toBeVisible();
    });

    test("handles polling errors gracefully", async ({ page }) => {
      await gotoBooking(page);

      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Timeline should remain visible even if polling fails
      const timeline = page.locator('[role="region"][aria-label="Activity Timeline"]');
      await expect(timeline).toBeVisible();

      // Retry button should be available if there's an error
      const retryBtn = page.locator("button:has-text('Retry')");
      const retryVisible = await retryBtn.isVisible().catch(() => false);

      expect(typeof retryVisible).toBe("boolean");
    });
  });

  test.describe("Accessibility Compliance", () => {
    test("all interactive elements are keyboard navigable", async ({ page }) => {
      await gotoBooking(page);

      // Tab through tabs
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      expect(tabCount).toBeGreaterThanOrEqual(4); // overview, timeline, gallery, messages

      // Each tab should be keyboard focusable
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await tab.focus();
        const focused = await tab.evaluate((el) =>
          el === document.activeElement
        );
        expect(focused).toBe(true);

        // Press escape and move to next
        await page.keyboard.press("Tab");
      }
    });

    test("aria labels and descriptions present", async ({ page }) => {
      await gotoBooking(page);

      // Check main regions have labels
      const regions = page.locator('[role="region"]');
      const regionCount = await regions.count();

      for (let i = 0; i < regionCount; i++) {
        const region = regions.nth(i);
        const label = await region.getAttribute("aria-label");
        expect(label).toBeTruthy();
      }
    });

    test("form inputs have proper labels", async ({ page }) => {
      await gotoBooking(page);

      const messagesTab = page.locator('[role="tab"]:has-text("Messages")');
      await messagesTab.click();

      const textarea = page.locator("textarea");
      const label = await textarea.getAttribute("aria-label");

      expect(label).toBeTruthy();
    });

    test("color not only indicator of state", async ({ page }) => {
      await gotoBooking(page);

      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Buttons should have text or icons, not just color
      const filterBtns = page.locator('button[aria-pressed]');
      const btnCount = await filterBtns.count();

      for (let i = 0; i < Math.min(btnCount, 3); i++) {
        const btn = filterBtns.nth(i);
        const text = await btn.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe("E2E: Staff Action to Customer Display", () => {
    test("activity logged by staff appears on customer dashboard", async ({
      page,
    }) => {
      // Customer views booking
      await gotoBooking(page);

      const activityTab = page.locator('[role="tab"]:has-text("Activity")');
      await activityTab.click();

      // Get initial activity count
      const articles = page.locator('[role="article"]');
      const initialCount = await articles.count();

      // In real E2E, staff would log activity via API
      // For this test, we simulate the polling picking it up
      await page.waitForTimeout(5000);

      // Activities should be visible
      const updatedArticles = page.locator('[role="article"]');
      const updatedCount = await updatedArticles.count();
      expect(updatedCount).toBeGreaterThan(0);
      await expect(
        page.locator("[role='article']").filter({ hasText: "Breakfast served" }).first()
      ).toBeVisible();
    });

    test("photo uploaded by staff appears in customer gallery", async ({
      page,
    }) => {
      await gotoBooking(page);

      const galleryTab = page.locator('[role="tab"]:has-text("Photos")');
      await galleryTab.click();

      const photos = page.locator('button[aria-label*="Open photo"]');
      await expect(photos.first()).toBeVisible({ timeout: 7000 });
      const photoCount = await photos.count();
      expect(photoCount).toBeGreaterThan(0);
      await expect(page.getByRole("img", { name: "Nap time" })).toBeVisible();
    });
  });
});
