import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type SessionLike = {
  user: { id: string; email?: string | null; name?: string | null; role?: string };
} | null;

const {
  authMock,
  getAdminSettingsMock,
  stripeMock,
  isStripeConfiguredMock,
} = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<SessionLike>>(async () => ({
    user: { id: "user-001", email: "owner@example.com", name: "Owner" },
  })),
  getAdminSettingsMock: vi.fn(async () => ({
    stripeCapabilityFlags: {
      billingSubscriptionsEnabled: true,
      customerPortalEnabled: true,
      savedPaymentMethodsEnabled: true,
      oneClickRebookingEnabled: false,
      autopayEnabled: false,
      taxEnabled: false,
      disputesEnabled: false,
      radarReviewEnabled: false,
      connectEnabled: false,
      treasuryEnabled: false,
      issuingEnabled: false,
      financialConnectionsEnabled: false,
      identityEnabled: false,
      terminalEnabled: false,
      premiumCheckoutReassuranceEnabled: false,
      premiumCheckoutCopyEnabled: false,
      premiumCheckoutTrustIndicatorsEnabled: false,
      premiumCheckoutLoadingExperienceEnabled: false,
    },
  })),
  stripeMock: {
    customers: {
      list: vi.fn(async () => ({ data: [{ id: "cus_existing_001" }] })),
      create: vi.fn(async () => ({ id: "cus_created_001" })),
      retrieve: vi.fn(async () => ({
        id: "cus_existing_001",
        deleted: false,
        invoice_settings: { default_payment_method: "pm_default_001" },
      })),
      update: vi.fn(async () => ({ id: "cus_existing_001" })),
    },
    setupIntents: {
      create: vi.fn(async () => ({
        id: "seti_001",
        client_secret: "seti_secret_001",
      })),
    },
    paymentMethods: {
      list: vi.fn(async () => ({
        data: [
          {
            id: "pm_default_001",
            card: { brand: "visa", exp_month: 12, exp_year: 2030, last4: "4242" },
          },
          {
            id: "pm_alt_001",
            card: { brand: "mastercard", exp_month: 8, exp_year: 2031, last4: "4444" },
          },
        ],
      })),
      retrieve: vi.fn(async (id: string) => ({
        id,
        customer: "cus_existing_001",
      })),
      detach: vi.fn(async (id: string) => ({ id })),
    },
  },
  isStripeConfiguredMock: vi.fn(() => true),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/api/admin-settings", () => ({ getAdminSettings: getAdminSettingsMock }));
vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  isStripeConfigured: isStripeConfiguredMock,
}));

import { POST as createSetupIntent } from "@/app/api/payments/setup-intent/route";
import { GET as listPaymentMethods } from "@/app/api/payments/payment-methods/route";
import { PATCH as setDefaultMethod } from "@/app/api/payments/payment-methods/default/route";
import { DELETE as removePaymentMethod } from "@/app/api/payments/payment-methods/[paymentMethodId]/route";

describe("payments wallet routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates setup intent when wallet is enabled", async () => {
    const request = new NextRequest("http://localhost/api/payments/setup-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": "setup-intent-cid",
      },
      body: JSON.stringify({ usage: "off_session" }),
    });

    const response = await createSetupIntent(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.setupIntentId).toBe("seti_001");
    expect(payload.clientSecret).toBe("seti_secret_001");
    expect(stripeMock.setupIntents.create).toHaveBeenCalledTimes(1);
  });

  it("lists card payment methods", async () => {
    const request = new NextRequest("http://localhost/api/payments/payment-methods", {
      method: "GET",
      headers: {
        "x-correlation-id": "payment-methods-cid",
      },
    });

    const response = await listPaymentMethods(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.paymentMethods).toHaveLength(2);
    expect(payload.paymentMethods[0]).toMatchObject({
      id: "pm_default_001",
      isDefault: true,
    });
  });

  it("updates default payment method", async () => {
    const request = new NextRequest("http://localhost/api/payments/payment-methods/default", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": "payment-method-default-cid",
      },
      body: JSON.stringify({ paymentMethodId: "pm_alt_001" }),
    });

    const response = await setDefaultMethod(request);
    expect(response.status).toBe(200);
    expect(stripeMock.customers.update).toHaveBeenCalledWith("cus_existing_001", {
      invoice_settings: { default_payment_method: "pm_alt_001" },
    });
  });

  it("detaches a payment method", async () => {
    const request = new NextRequest("http://localhost/api/payments/payment-methods/pm_alt_001", {
      method: "DELETE",
      headers: {
        "x-correlation-id": "payment-method-remove-cid",
      },
    });

    const response = await removePaymentMethod(request, {
      params: Promise.resolve({ paymentMethodId: "pm_alt_001" }),
    });

    expect(response.status).toBe(200);
    expect(stripeMock.paymentMethods.detach).toHaveBeenCalledWith("pm_alt_001");
  });

  it("blocks wallet routes when feature is disabled", async () => {
    getAdminSettingsMock.mockResolvedValueOnce({
      stripeCapabilityFlags: {
        billingSubscriptionsEnabled: true,
        customerPortalEnabled: true,
        savedPaymentMethodsEnabled: false,
        oneClickRebookingEnabled: false,
        autopayEnabled: false,
        taxEnabled: false,
        disputesEnabled: false,
        radarReviewEnabled: false,
        connectEnabled: false,
        treasuryEnabled: false,
        issuingEnabled: false,
        financialConnectionsEnabled: false,
        identityEnabled: false,
        terminalEnabled: false,
        premiumCheckoutReassuranceEnabled: false,
        premiumCheckoutCopyEnabled: false,
        premiumCheckoutTrustIndicatorsEnabled: false,
        premiumCheckoutLoadingExperienceEnabled: false,
      },
    });

    const request = new NextRequest("http://localhost/api/payments/payment-methods", {
      method: "GET",
    });

    const response = await listPaymentMethods(request);
    expect(response.status).toBe(403);
  });
});
