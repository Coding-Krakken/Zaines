# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: parent-experience-live-feed.spec.ts >> Parent Experience Live Feed - Issue #62 >> Accessibility Compliance >> color not only indicator of state
- Location: tests/e2e/parent-experience-live-feed.spec.ts:553:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4020/dashboard/bookings/test-booking-123
Call log:
  - navigating to "http://localhost:4020/dashboard/bookings/test-booking-123", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | const TEST_BOOKING_ID = "test-booking-123";
  4   | 
  5   | async function gotoBooking(page: Page) {
> 6   |   await page.goto(`/dashboard/bookings/${TEST_BOOKING_ID}`);
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4020/dashboard/bookings/test-booking-123
  7   |   await expect(page).not.toHaveURL(/\/auth\/signin/);
  8   | }
  9   | 
  10  | test.describe("Parent Experience Live Feed - Issue #62", () => {
  11  |   test.beforeEach(async ({ page, context }) => {
  12  |     const activitiesPage1 = [
  13  |       {
  14  |         id: "activity-1",
  15  |         type: "feeding",
  16  |         description: "Breakfast served",
  17  |         performedBy: "Staff",
  18  |         performedAt: "2026-05-05T10:00:00.000Z",
  19  |         notes: "Ate all food",
  20  |         pet: { id: "pet-1", name: "Milo" },
  21  |       },
  22  |       {
  23  |         id: "activity-2",
  24  |         type: "walk",
  25  |         description: "Morning walk",
  26  |         performedBy: "Staff",
  27  |         performedAt: "2026-05-05T09:00:00.000Z",
  28  |         notes: "Great energy",
  29  |         pet: { id: "pet-1", name: "Milo" },
  30  |       },
  31  |     ];
  32  |     const activitiesPage2 = [
  33  |       {
  34  |         id: "activity-3",
  35  |         type: "play",
  36  |         description: "Play session",
  37  |         performedBy: "Staff",
  38  |         performedAt: "2026-05-05T08:00:00.000Z",
  39  |         notes: "Loved fetch",
  40  |         pet: { id: "pet-1", name: "Milo" },
  41  |       },
  42  |     ];
  43  | 
  44  |     const photos = [
  45  |       {
  46  |         id: "photo-1",
  47  |         imageUrl: "/file.svg",
  48  |         caption: "Nap time",
  49  |         uploadedBy: "Staff",
  50  |         uploadedAt: "2026-05-05T10:10:00.000Z",
  51  |         pet: { id: "pet-1", name: "Milo" },
  52  |       },
  53  |     ];
  54  | 
  55  |     const messages = [
  56  |       {
  57  |         id: "message-1",
  58  |         content: "Milo is doing great today!",
  59  |         senderType: "staff",
  60  |         senderName: "Staff",
  61  |         sentAt: "2026-05-05T10:20:00.000Z",
  62  |         isRead: true,
  63  |       },
  64  |     ];
  65  | 
  66  |     await context.addCookies([
  67  |       {
  68  |         name: "e2e-customer",
  69  |         value: "1",
  70  |         domain: "localhost",
  71  |         path: "/",
  72  |       },
  73  |     ]);
  74  | 
  75  |     await page.route(`**/api/bookings/${TEST_BOOKING_ID}/activities**`, async (route) => {
  76  |       if (route.request().method() !== "GET") {
  77  |         await route.fulfill({ status: 405, body: "" });
  78  |         return;
  79  |       }
  80  | 
  81  |       const url = new URL(route.request().url());
  82  |       const cursor = url.searchParams.get("cursor");
  83  |       const items = cursor ? activitiesPage2 : activitiesPage1;
  84  | 
  85  |       await route.fulfill({
  86  |         status: 200,
  87  |         contentType: "application/json",
  88  |         body: JSON.stringify({
  89  |           items,
  90  |           hasMore: !cursor,
  91  |           nextCursor: cursor ? null : "activity-2",
  92  |           timestamp: new Date().toISOString(),
  93  |         }),
  94  |       });
  95  |     });
  96  | 
  97  |     await page.route(`**/api/bookings/${TEST_BOOKING_ID}/photos**`, async (route) => {
  98  |       if (route.request().method() !== "GET") {
  99  |         await route.fulfill({ status: 405, body: "" });
  100 |         return;
  101 |       }
  102 | 
  103 |       await route.fulfill({
  104 |         status: 200,
  105 |         contentType: "application/json",
  106 |         body: JSON.stringify({
```