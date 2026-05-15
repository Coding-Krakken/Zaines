/**
 * SEO Metadata Validation Test Suite
 * 
 * Validates metadata tags on key pages for SEO best practices.
 * Tests title tags, meta descriptions, Open Graph tags, and canonical URLs.
 * 
 * NOTE: These tests require the Next.js server to be running.
 * They will build and start the server automatically but this adds ~30s overhead.
 * 
 * Run: pnpm test -- seo/metadata
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  startTestServer, 
  stopTestServer, 
  getMetadata, 
  checkMetadata,
} from './helpers';

// Routes to test
const routes = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/services/daycare',
  '/services/boarding',
  '/services/grooming',
  '/gallery',
  '/reviews',
  '/faq',
  '/book',
];

describe('SEO Metadata Validation', () => {
  // Start server before tests
  beforeAll(async () => {
    await startTestServer();
  }, 60000); // 60 second timeout for build

  // Stop server after tests
  afterAll(async () => {
    await stopTestServer();
  });

  describe('Title Tags', () => {
    routes.forEach((route) => {
      it(`${route} should have a title tag`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.title).toBeDefined();
        expect(metadata.title.length).toBeGreaterThan(0);
      });

      it(`${route} title should be 50-60 characters`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.title.length).toBeGreaterThanOrEqual(50);
        expect(metadata.title.length).toBeLessThanOrEqual(60);
      });
    });
  });

  describe('Meta Descriptions', () => {
    routes.forEach((route) => {
      it(`${route} should have a meta description`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.description).toBeDefined();
        expect(metadata.description.length).toBeGreaterThan(0);
      });

      it(`${route} description should be 150-160 characters`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.description.length).toBeGreaterThanOrEqual(150);
        expect(metadata.description.length).toBeLessThanOrEqual(160);
      });
    });
  });

  describe('Open Graph Tags', () => {
    routes.forEach((route) => {
      it(`${route} should have og:title`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.ogTitle).toBeDefined();
      });

      it(`${route} should have og:description`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.ogDescription).toBeDefined();
      });

      it(`${route} should have og:image`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.ogImage).toBeDefined();
        expect(metadata.ogImage).toMatch(/^https?:\/\//);
      });

      it(`${route} should have og:url`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.ogUrl).toBeDefined();
        expect(metadata.ogUrl).toContain('zainesstayandplay.com');
      });
    });
  });

  describe('Twitter Card Tags', () => {
    routes.forEach((route) => {
      it(`${route} should have twitter:card`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.twitterCard).toBeDefined();
        expect(['summary', 'summary_large_image']).toContain(metadata.twitterCard);
      });

      it(`${route} should have twitter:title or fallback to og:title`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.twitterTitle || metadata.ogTitle).toBeDefined();
      });

      it(`${route} should have twitter:image or fallback to og:image`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.twitterImage || metadata.ogImage).toBeDefined();
      });
    });
  });

  describe('Canonical URLs', () => {
    routes.forEach((route) => {
      it(`${route} should have a canonical URL`, async () => {
        const metadata = await getMetadata(route);
        expect(metadata.canonical).toBeDefined();
        expect(metadata.canonical).toContain('zainesstayandplay.com');
      });

      it(`${route} canonical URL should match the route`, async () => {
        const metadata = await getMetadata(route);
        const expectedPath = route === '/' ? '' : route;
        expect(metadata.canonical).toContain(expectedPath);
      });
    });
  });

  describe('Unique Titles', () => {
    it('all pages should have unique titles', async () => {
      const titles = new Set<string>();
      
      for (const route of routes) {
        const metadata = await getMetadata(route);
        expect(titles.has(metadata.title)).toBe(false);
        titles.add(metadata.title);
      }
    });
  });

  describe('Best Practices', () => {
    routes.forEach((route) => {
      it(`${route} should pass SEO best practices check`, async () => {
        const check = await checkMetadata(route);
        
        // Should have no critical errors
        expect(check.errors).toHaveLength(0);
        
        // Log warnings for awareness
        if (check.warnings.length > 0) {
          console.warn(`${route} warnings:`, check.warnings);
        }
      });
    });
  });
});
