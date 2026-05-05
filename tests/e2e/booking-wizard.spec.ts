import { expect, test } from "@playwright/test";

type BookingRouteMode = "success" | "fail-once" | "fallback";
type ValidationRouteMode = "success" | "fail-once";

async function selectRadixOption(
  page: import("@playwright/test").Page,
  triggerLabel: string,
  optionText: string,
) {
  await page.getByRole("combobox", { name: triggerLabel }).click();
  await page.getByRole("option", { name: optionText }).click();
}

async function installBookingFunnelMocks(
  page: import("@playwright/test").Page,
  options?: {
    bookingRouteMode?: BookingRouteMode;
    validationRouteMode?: ValidationRouteMode;
  },
) {
  let bookingRequestCount = 0;
  let validationRequestCount = 0;

  await page.route("**/api/booking/availability", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        isAvailable: true,
        availability: {
          standard: 2,
          deluxe: 1,
          luxury: 1,
        },
        pricing: {
          nightlyRate: 85,
        },
      }),
    });
  });

  await page.route("**/api/bookings/validate", async (route) => {
    validationRequestCount += 1;

    if (
      options?.validationRouteMode === "fail-once" &&
      validationRequestCount === 1
    ) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Unable to validate booking pricing right now. Please retry.",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: true,
        pricing: {
          subtotal: 255,
          tax: 25.5,
          total: 280.5,
          currency: "USD",
          pricingModelLabel: "Pre-confirmation estimate",
          disclosure:
            "Total price is shown before confirmation with no hidden fees or surprise add-ons.",
        },
      }),
    });
  });

  await page.route("**/api/upload/vaccine", async (route) => {
    const request = route.request();
    const postData = request.postDataBuffer();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: `https://files.example.test/${postData?.length || 0}-vaccine.pdf`,
      }),
    });
  });

  await page.route("**/api/bookings", async (route) => {
    bookingRequestCount += 1;

    if (
      options?.bookingRouteMode === "fail-once" &&
      bookingRequestCount === 1
    ) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Failed to initialize booking payment",
        }),
      });
      return;
    }

    if (options?.bookingRouteMode === "fallback") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          booking: {
            id: "booking-fallback-001",
            bookingNumber: "PB-20260504-0002",
          },
          pricing: {
            subtotal: 255,
            tax: 25.5,
            total: 280.5,
            currency: "USD",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        booking: {
          id: "booking-success-001",
          bookingNumber: "PB-20260504-0001",
        },
        pricing: {
          subtotal: 255,
          tax: 25.5,
          total: 280.5,
          currency: "USD",
        },
      }),
    });
  });
}

async function completeBookingWizard(
  page: import("@playwright/test").Page,
  options?: { stopBeforePayment?: boolean },
) {
  await page.goto("/book");

  await page.getByLabel("Check-in Date *").fill("2026-06-10");
  await page.getByLabel("Check-out Date *").fill("2026-06-13");
  await selectRadixOption(page, "Service Type *", "Overnight Boarding");
  await expect(page.getByText("Suites Available!")).toBeVisible();
  await page.getByRole("button", { name: "Continue to Suite Selection" }).click();

  await page.getByRole("button", { name: /Deluxe Suite/i }).click();
  await page.getByRole("button", { name: "Continue to Account" }).click();

  await page.getByLabel("First Name *").fill("Morgan");
  await page.getByLabel("Last Name *").fill("Lee");
  await page.getByLabel("Phone Number *").fill("3155551234");
  await page.getByLabel(/email/i).fill("morgan@example.com");
  await page.getByRole("button", { name: "Continue to Pet Profiles" }).click();

  await page.getByRole("button", { name: "Add New Pet Profile" }).click();
  await page.getByLabel("Name *").fill("Scout");
  await page.getByLabel("Breed *").fill("Beagle");
  await page.getByLabel("Age (years) *").fill("4");
  await page.getByLabel("Weight (lbs) *").fill("28");
  await page.getByRole("button", { name: "Add Pet" }).click();
  await expect(page.getByText("Scout", { exact: true })).toBeVisible();
  await expect(page.getByText(/Vaccination Required:/i)).toBeVisible();

  const vaccineInput = page.locator("input[id='vaccine-new-0']");
  await vaccineInput.setInputFiles({
    name: "scout-vaccine.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("vaccine-pdf"),
  });

  await expect(page.getByText(/Vaccine uploaded/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Continue to Waivers" }).click();

  await page.locator("label[for='liability']").click();
  await page.locator("label[for='medical']").click();
  await page.locator("label[for='photo']").click();

  const signaturePad = page.getByTestId("booking-signature-pad");
  await signaturePad.hover();
  await page.mouse.down();
  await page.mouse.move(240, 300);
  await page.mouse.move(280, 320);
  await page.mouse.up();

  await page.getByRole("button", { name: "Save Signature" }).click();
  await page.getByRole("button", { name: "Continue to Payment" }).click();

  if (options?.stopBeforePayment) {
    return;
  }

  await expect(page.getByText(/Booking Ready|Preparing secure checkout/i)).toBeVisible();
}

test.describe("Booking Wizard Flow", () => {
  test("completes the guest booking flow through confirmation when payment falls back", async ({
    page,
  }) => {
    await installBookingFunnelMocks(page, { bookingRouteMode: "fallback" });
    await completeBookingWizard(page);

    await page.locator("label[for='pricing-disclosure']").click();
    await page.getByRole("button", { name: "Complete Booking" }).click();

    await expect(page).toHaveURL(/\/book\/confirmation\?bookingId=booking-fallback-001/);
    await expect(page.getByText("Booking Confirmed!")).toBeVisible();
    await expect(page.getByText("PB-20260504-0002")).toBeVisible();
    await expect(page.getByText("Subtotal:")).toBeVisible();
    await expect(page.getByRole("link", { name: "support page" })).toBeVisible();
  });

  test("recovers from stale saved wizard progress by returning to the first incomplete step", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "booking-wizard-progress",
        JSON.stringify({
          currentStep: "payment",
          data: {
            dates: {
              checkIn: "2026-06-10",
              checkOut: "2026-06-13",
              serviceType: "boarding",
              petCount: 1,
            },
            suites: {
              suiteType: "deluxe",
              addOns: [],
            },
          },
        }),
      );
    });

    await installBookingFunnelMocks(page);
    await page.goto("/book");

    await expect(
      page.getByRole("button", {
        name: /Continue to (Suite Selection|Account|Pet Profiles|Waivers)/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Payment Information" }),
    ).toHaveCount(0);
  });

  test("recovers from pricing validation failure with a retry path", async ({ page }) => {
    await installBookingFunnelMocks(page, { validationRouteMode: "fail-once" });
    await completeBookingWizard(page, { stopBeforePayment: true });

    // Wait for error message to appear
    await expect(page.getByText("Unable to validate booking pricing right now. Please retry.")).toBeVisible({ timeout: 5000 });
    
    // Click retry button
    await page.getByRole("button", { name: "Retry pricing validation" }).click();
    
    // Verify retry succeeds
    await expect(page.getByText("Total before confirmation")).toBeVisible({ timeout: 5000 });
  });

});