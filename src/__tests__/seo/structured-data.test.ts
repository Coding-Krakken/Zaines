/**
 * Structured Data Validation Test Suite
 * 
 * Validates JSON-LD structured data (schema.org) on key pages.
 * Ensures LocalBusiness, Service, and FAQPage schemas are valid.
 * 
 * NOTE: These tests require the Next.js server to be running.
 * They will build and start the server automatically but this adds ~30s overhead.
 * 
 * Run: pnpm test -- seo/structured-data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, getStructuredData } from './helpers';

describe('Structured Data Validation', () => {
  // Start server before tests
  beforeAll(async () => {
    await startTestServer();
  }, 60000); // 60 second timeout for build

  // Stop server after tests
  afterAll(async () => {
    await stopTestServer();
  });

  describe('LocalBusiness Schema', () => {
    it('should have LocalBusiness schema on homepage', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      expect(localBusiness).toBeDefined();
    });

    it('LocalBusiness should have required properties', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      // Required properties
      expect(localBusiness.name).toBeDefined();
      expect(localBusiness.address).toBeDefined();
      expect(localBusiness.telephone).toBeDefined();
      expect(localBusiness.url).toBeDefined();
      
      // Recommended properties for rich results
      expect(localBusiness.priceRange).toBeDefined();
      expect(localBusiness.image).toBeDefined();
      expect(localBusiness.openingHoursSpecification).toBeDefined();
    });

    it('LocalBusiness address should be valid', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      const address = localBusiness.address;
      expect(address['@type']).toBe('PostalAddress');
      expect(address.streetAddress).toBeDefined();
      expect(address.addressLocality).toBeDefined();
      expect(address.addressRegion).toBeDefined();
      expect(address.postalCode).toBeDefined();
      expect(address.addressCountry).toBeDefined();
    });

    it('LocalBusiness should have geo coordinates', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      expect(localBusiness.geo).toBeDefined();
      expect(localBusiness.geo['@type']).toBe('GeoCoordinates');
      expect(typeof localBusiness.geo.latitude).toBe('number');
      expect(typeof localBusiness.geo.longitude).toBe('number');
    });

    it('LocalBusiness should have opening hours', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      const hours = localBusiness.openingHoursSpecification;
      expect(Array.isArray(hours)).toBe(true);
      expect(hours.length).toBeGreaterThan(0);
      
      hours.forEach((spec: any) => {
        expect(spec['@type']).toBe('OpeningHoursSpecification');
        expect(spec.dayOfWeek).toBeDefined();
        expect(spec.opens).toMatch(/^\d{2}:\d{2}$/);
        expect(spec.closes).toMatch(/^\d{2}:\d{2}$/);
      });
    });
  });

  describe('Service Schema', () => {
    const servicePages = [
      '/services/daycare',
      '/services/boarding',
      '/services/grooming',
    ];

    servicePages.forEach((page) => {
      it(`${page} should have Service schema`, async () => {
        const schemas = await getStructuredData(page);
        const service = schemas.find((s: any) => s['@type'] === 'Service');
        
        expect(service).toBeDefined();
      });

      it(`${page} Service should have required properties`, async () => {
        const schemas = await getStructuredData(page);
        const service = schemas.find((s: any) => s['@type'] === 'Service');
        
        expect(service.name).toBeDefined();
        expect(service.description).toBeDefined();
        expect(service.provider).toBeDefined();
        expect(service.areaServed).toBeDefined();
      });

      it(`${page} Service provider should link to LocalBusiness`, async () => {
        const schemas = await getStructuredData(page);
        const service = schemas.find((s: any) => s['@type'] === 'Service');
        
        expect(service.provider['@type']).toBe('LocalBusiness');
        expect(service.provider.name).toBe("Zaine's Stay & Play");
      });
    });
  });

  describe('FAQPage Schema', () => {
    it('/faq should have FAQPage schema', async () => {
      const schemas = await getStructuredData('/faq');
      const faqPage = schemas.find((s: any) => s['@type'] === 'FAQPage');
      
      expect(faqPage).toBeDefined();
    });

    it('FAQPage should have mainEntity array', async () => {
      const schemas = await getStructuredData('/faq');
      const faqPage = schemas.find((s: any) => s['@type'] === 'FAQPage');
      
      expect(Array.isArray(faqPage.mainEntity)).toBe(true);
      expect(faqPage.mainEntity.length).toBeGreaterThan(0);
    });

    it('FAQPage questions should be valid', async () => {
      const schemas = await getStructuredData('/faq');
      const faqPage = schemas.find((s: any) => s['@type'] === 'FAQPage');
      
      faqPage.mainEntity.forEach((question: any) => {
        expect(question['@type']).toBe('Question');
        expect(question.name).toBeDefined();
        expect(question.acceptedAnswer).toBeDefined();
        expect(question.acceptedAnswer['@type']).toBe('Answer');
        expect(question.acceptedAnswer.text).toBeDefined();
      });
    });
  });

  describe('Schema Validation', () => {
    it('all schemas should have @context', async () => {
      const routes = ['/', '/services/daycare', '/faq'];
      
      for (const route of routes) {
        const schemas = await getStructuredData(route);
        schemas.forEach((s: any) => {
          expect(s['@context']).toBe('https://schema.org');
        });
      }
    });

    it('schemas should not use @graph (prefer separate items)', async () => {
      const routes = ['/', '/services/daycare', '/faq'];
      
      for (const route of routes) {
        const schemas = await getStructuredData(route);
        schemas.forEach((s: any) => {
          expect(s['@graph']).toBeUndefined();
        });
      }
    });

    it('all required properties should have correct types', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      // Validate property types
      expect(typeof localBusiness.name).toBe('string');
      expect(typeof localBusiness.telephone).toBe('string');
      expect(typeof localBusiness.url).toBe('string');
      expect(typeof localBusiness.address).toBe('object');
    });
  });

  describe('Rich Results Eligibility', () => {
    it('LocalBusiness should have properties for rich results', async () => {
      const schemas = await getStructuredData('/');
      const localBusiness = schemas.find((s: any) => s['@type'] === 'LocalBusiness');
      
      // Check for properties that enable rich results in Google Search
      expect(localBusiness.image).toBeDefined();
      expect(localBusiness.aggregateRating || localBusiness.review).toBeTruthy();
      expect(localBusiness.priceRange).toBeDefined();
    });
  });
});
