import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

describe('Environment Variable Safety', () => {
  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Clear environment variables for each test
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    consoleWarnSpy?.mockRestore();
  });

  describe('Stripe Configuration Helpers', () => {
    it('should detect when Stripe is not configured', async () => {
      const { isStripeConfigured } = await import('@/lib/stripe');
      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe('Database Configuration Helpers', () => {
    it('should detect when database is not configured', async () => {
      const { isDatabaseConfigured } = await import('@/lib/prisma');
      expect(isDatabaseConfigured()).toBe(false);
    });
  });

  describe('Stripe Client Configuration', () => {
    it('should return null when Stripe publishable key is missing', async () => {
      const { getStripe, isStripeConfigured } = await import('@/lib/stripe-client');
      
      expect(isStripeConfigured()).toBe(false);
      expect(getStripe()).toBe(null);
    });
  });

  describe('Module Import Safety', () => {
    it('should not crash when importing stripe module without env var', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      
      // This should not throw during import
      const importStripe = async () => {
        await import('@/lib/stripe');
      };
      
      await expect(importStripe()).resolves.not.toThrow();
    });

    it('should not crash when importing prisma module without DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;
      
      // This should not throw during import
      const importPrisma = async () => {
        await import('@/lib/prisma');
      };
      
      await expect(importPrisma()).resolves.not.toThrow();
    });

    it('should not crash when importing stripe-client without publishable key', async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      
      // This should not throw during import
      const importStripeClient = async () => {
        await import('@/lib/stripe-client');
      };
      
      await expect(importStripeClient()).resolves.not.toThrow();
    });
  });
});


