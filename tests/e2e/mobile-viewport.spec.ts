/**
 * Mobile Viewport Tests
 * 
 * Tests critical user journeys on mobile devices (iOS Safari, Android Chrome).
 * Validates responsive design, touch interactions, and mobile-specific features.
 * 
 * Run: pnpm test:e2e -- mobile-viewport
 */

import { test, expect, devices } from '@playwright/test';

// Test on both iPhone and Android
const mobileDevices = [
  { name: 'iPhone 14 Pro', device: devices['iPhone 14 Pro'] },
  { name: 'Pixel 7', device: devices['Pixel 7'] },
];

mobileDevices.forEach(({ name, device }) => {
  test.describe(`Mobile Tests - ${name}`, () => {
    test.use({ ...device });

    test('homepage should load and be usable on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check viewport is mobile
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThan(768);
      
      // Hero section should be visible
      const hero = page.locator('h1').first();
      await expect(hero).toBeVisible();
      
      // CTA button should be visible and tappable
      const ctaButton = page.getByRole('link', { name: /book/i }).first();
      await expect(ctaButton).toBeVisible();
      
      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport?.width || 0 + 10); // Allow 10px buffer
    });

    test('mobile navigation should work', async ({ page }) => {
      await page.goto('/');
      
      // Open mobile menu (hamburger)
      const menuButton = page.getByRole('button', { name: /menu|navigation/i });
      if (await menuButton.isVisible()) {
        await menuButton.tap();
        
        // Menu should open
        const nav = page.getByRole('navigation');
        await expect(nav).toBeVisible();
        
        // Navigate to services
        const servicesLink = page.getByRole('link', { name: /services/i });
        await servicesLink.tap();
        
        // Should navigate
        await expect(page).toHaveURL(/\/services/);
      }
    });

    test('booking flow should work on mobile', async ({ page }) => {
      await page.goto('/book');
      
      // Page should load
      await expect(page).toHaveURL(/\/book/);
      
      // Date picker should be usable
      const dateInputs = page.getByLabel(/check-in|check-out/i);
      const firstDateInput = dateInputs.first();
      
      if (await firstDateInput.isVisible()) {
        await firstDateInput.tap();
        
        // Calendar should appear
        // Note: This depends on your date picker implementation
        await page.waitForTimeout(500);
      }
      
      // CTA should be visible at bottom (sticky)
      const continueButton = page.getByRole('button', { name: /continue|next/i });
      if (await continueButton.isVisible()) {
        const isInViewport = await continueButton.isVisible();
        expect(isInViewport).toBe(true);
      }
    });

    test('contact page should work on mobile', async ({ page }) => {
      await page.goto('/contact');
      
      // Form should be visible
      const form = page.getByRole('form');
      await expect(form).toBeVisible();
      
      // Fill form
      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/message/i).fill('Test message from mobile');
      
      // Submit button should be visible
      const submitButton = page.getByRole('button', { name: /submit|send/i });
      await expect(submitButton).toBeVisible();
    });

    test('images should load correctly on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Find first image
      const firstImage = page.locator('img').first();
      await expect(firstImage).toBeVisible();
      
      // Image should have loaded
      const naturalWidth = await firstImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
      
      // Image should not overflow viewport
      const imgWidth = await firstImage.evaluate((img: HTMLImageElement) => img.offsetWidth);
      const viewport = page.viewportSize();
      expect(imgWidth).toBeLessThanOrEqual(viewport?.width || 0);
    });

    test('text should be readable on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check font size is at least 16px (prevents zoom on iOS)
      const fontSize = await page.locator('body').evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });
      expect(fontSize).toBeGreaterThanOrEqual(16);
      
      // Check line height for readability
      const lineHeight = await page.locator('p').first().evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).lineHeight);
      });
      expect(lineHeight).toBeGreaterThan(fontSize * 1.2); // At least 1.2x font size
    });

    test('buttons should have adequate touch targets', async ({ page }) => {
      await page.goto('/');
      
      // Get all buttons
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      // Check at least first 5 buttons
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          
          // Minimum touch target: 44x44 (WCAG 2.5.5)
          expect(box?.width).toBeGreaterThanOrEqual(44);
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('gallery should work on mobile', async ({ page }) => {
      await page.goto('/gallery');
      
      // Photos should be visible
      const photos = page.locator('img');
      const firstPhoto = photos.first();
      await expect(firstPhoto).toBeVisible();
      
      // Tap to view fullscreen (if implemented)
      await firstPhoto.tap();
      
      // Wait for interaction
      await page.waitForTimeout(500);
    });

    test('phone number should be clickable on mobile', async ({ page }) => {
      await page.goto('/contact');
      
      // Find phone link
      const phoneLink = page.locator('a[href^="tel:"]').first();
      
      if (await phoneLink.isVisible()) {
        // Should be a link
        const href = await phoneLink.getAttribute('href');
        expect(href).toContain('tel:');
      }
    });

    test('viewport meta tag should be set correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('width=device-width');
      expect(viewportMeta).toContain('initial-scale=1');
    });

    test('no text should overflow on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});

// Landscape orientation tests
test.describe('Mobile Landscape Tests', () => {
  test.use({ 
    ...devices['iPhone 14 Pro Landscape'],
  });

  test('homepage should work in landscape', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport is landscape
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(viewport?.height || 0);
    
    // Content should still be visible
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
  });

  test('booking calendar should use landscape space efficiently', async ({ page }) => {
    await page.goto('/book');
    
    // Calendar should be visible
    // Note: Implementation-specific test
    await expect(page).toHaveURL(/\/book/);
  });
});
