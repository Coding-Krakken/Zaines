/**
 * SEO Test Helpers
 * 
 * Utility functions for fetching and parsing HTML metadata in tests.
 * Builds Next.js app and fetches real HTML for validation.
 */

import { execSync } from 'child_process';
import { JSDOM } from 'jsdom';

let serverProcess: ReturnType<typeof import('child_process').spawn> | null = null;
let serverReady = false;
const BASE_URL = 'http://localhost:3001'; // Use different port to avoid conflicts

/**
 * Start Next.js server for testing
 */
export async function startTestServer(): Promise<void> {
  if (serverReady) return;

  // Build Next.js app (only once)
  console.log('Building Next.js app...');
  execSync('pnpm build', { stdio: 'inherit' });

  // Start server
  console.log('Starting Next.js server...');
  const { spawn } = await import('child_process');
  serverProcess = spawn('pnpm', ['start', '-p', '3001'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db',
      AUTH_SECRET: 'test-secret',
      NEXTAUTH_SECRET: 'test-secret',
      AUTH_URL: BASE_URL,
      NEXTAUTH_URL: BASE_URL,
    },
  });

  // Wait for server to be ready
  await waitForServer(BASE_URL, 30000);
  serverReady = true;
  console.log('Next.js server ready');
}

/**
 * Stop test server
 */
export async function stopTestServer(): Promise<void> {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
    serverReady = false;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Server failed to start within ${timeout}ms`);
}

/**
 * Fetch HTML for a route
 */
export async function fetchHTML(route: string): Promise<string> {
  const url = `${BASE_URL}${route}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
}

/**
 * Parse metadata from HTML
 */
export interface PageMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
}

export async function getMetadata(route: string): Promise<PageMetadata> {
  const html = await fetchHTML(route);
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Extract metadata
  const metadata: PageMetadata = {
    title: document.querySelector('title')?.textContent || '',
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || undefined,
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || undefined,
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined,
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') || undefined,
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || undefined,
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || undefined,
    twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || undefined,
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || undefined,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || undefined,
  };

  return metadata;
}

/**
 * Extract structured data (JSON-LD) from HTML
 */
export async function getStructuredData(route: string): Promise<any[]> {
  const html = await fetchHTML(route);
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Find all JSON-LD scripts
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const schemas: any[] = [];

  scripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '');
      
      // Handle both single schema and array of schemas
      if (Array.isArray(data)) {
        schemas.push(...data);
      } else {
        schemas.push(data);
      }
    } catch (error) {
      console.error('Failed to parse JSON-LD:', error);
    }
  });

  return schemas;
}

/**
 * Check metadata meets SEO best practices
 */
export interface MetadataCheck {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function checkMetadata(route: string): Promise<MetadataCheck> {
  const metadata = await getMetadata(route);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!metadata.title) {
    errors.push('Missing title tag');
  } else if (metadata.title.length < 50 || metadata.title.length > 60) {
    warnings.push(`Title length ${metadata.title.length} chars (recommended: 50-60)`);
  }

  // Description validation
  if (!metadata.description) {
    errors.push('Missing meta description');
  } else if (metadata.description.length < 150 || metadata.description.length > 160) {
    warnings.push(`Description length ${metadata.description.length} chars (recommended: 150-160)`);
  }

  // Open Graph validation
  if (!metadata.ogTitle) warnings.push('Missing og:title');
  if (!metadata.ogDescription) warnings.push('Missing og:description');
  if (!metadata.ogImage) warnings.push('Missing og:image');
  if (!metadata.ogUrl) warnings.push('Missing og:url');

  // Twitter Card validation
  if (!metadata.twitterCard) warnings.push('Missing twitter:card');

  // Canonical URL validation
  if (!metadata.canonical) warnings.push('Missing canonical URL');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
