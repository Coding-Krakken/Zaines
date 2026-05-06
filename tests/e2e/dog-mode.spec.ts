import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

const BASE = process.env.E2E_BASE || "";

async function runAccessibilityScore(page: Page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    const axeRuntime = (
      window as typeof window & {
        axe: {
          run: () => Promise<{
            violations: Array<{ impact?: string; id: string }>;
          }>;
        };
      }
    ).axe;
    return axeRuntime.run();
  });

  const weightedLoss = results.violations.reduce((score, violation) => {
    if (violation.impact === "critical") return score + 20;
    if (violation.impact === "serious") return score + 10;
    if (violation.impact === "moderate") return score + 3;
    return score + 1;
  }, 0);

  return {
    score: Math.max(0, 100 - weightedLoss),
    violations: results.violations,
  };
}

test.describe("Dog Mode 2.0 tablet UX", () => {
  test("supports large kiosk interactions and emits no-PII telemetry", async ({
    page,
  }) => {
    const telemetry: unknown[] = [];
    await page.goto(`${BASE}/dog`);
    await page.evaluate(() => {
      window.localStorage.removeItem("dog-mode-telemetry");
    });
    await page.evaluate(() => {
      window.addEventListener("dog-mode-telemetry", (event) => {
        const customEvent = event as CustomEvent;
        (
          window as typeof window & { dogModeEvents?: unknown[] }
        ).dogModeEvents = [
          ...((window as typeof window & { dogModeEvents?: unknown[] })
            .dogModeEvents ?? []),
          customEvent.detail,
        ];
      });
    });

    await expect(page.getByRole("heading", { name: "Dog Mode" })).toBeVisible();
    await expect(page.getByLabel(/Boop pad/i)).toBeVisible();
    const boopBox = await page
      .getByRole("button", { name: /Boop pad/i })
      .boundingBox();
    expect(boopBox?.height).toBeGreaterThanOrEqual(280);

    await page.getByRole("button", { name: /Boop pad/i }).click();
    await page.getByRole("button", { name: /Quiet Rest/i }).click();
    await page.getByRole("switch", { name: "Calm" }).click();
    await page.getByRole("button", { name: "Signal Visible" }).click();

    telemetry.push(
      ...((await page.evaluate(
        () =>
          (window as typeof window & { dogModeEvents?: unknown[] })
            .dogModeEvents ?? [],
      )) as unknown[]),
    );

    expect(telemetry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "dog_mode_boop",
          reducedMotion: true,
          staffSignal: expect.objectContaining({
            visibility: "staff_dashboard_rollup",
          }),
        }),
        expect.objectContaining({
          event: "dog_mode_schedule_select",
          scheduleSlot: "quiet_rest",
        }),
        expect.objectContaining({
          event: "dog_mode_calm_toggle",
          calmEnabled: true,
        }),
      ]),
    );

    const serialized = JSON.stringify(telemetry).toLowerCase();
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("booking");
    expect(serialized).not.toContain("petid");
    await expect(page.getByText("Kiosk rollup only")).toBeVisible();
  });

  test("keeps /dog and /dog/calm accessibility at or above 95", async ({
    page,
  }) => {
    for (const route of ["/dog", "/dog/calm"]) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState("networkidle");

      const result = await runAccessibilityScore(page);

      expect(
        result.violations.filter(
          (violation) =>
            violation.impact === "critical" || violation.impact === "serious",
        ),
      ).toEqual([]);
      expect(result.score).toBeGreaterThanOrEqual(95);
    }
  });
});
