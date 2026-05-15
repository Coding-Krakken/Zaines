/**
 * Lighthouse CI Configuration
 * 
 * Runs performance, accessibility, SEO, and best practices audits
 * on key pages during CI/CD pipeline.
 * 
 * Thresholds based on existing performance budget from:
 * scripts/audit/issue66_performance_budget.js
 */

module.exports = {
  ci: {
    collect: {
      // Test key customer-facing pages
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/book',
        'http://localhost:3000/pricing',
        'http://localhost:3000/about',
        'http://localhost:3000/services/daycare',
        'http://localhost:3000/services/boarding',
      ],
      numberOfRuns: 3, // Run each URL 3 times for consistency
      settings: {
        preset: 'desktop',
        throttling: {
          // Simulate fast 4G connection
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance thresholds (aligned with audit script)
        'categories:performance': ['error', { minScore: 0.9 }], // >90
        'categories:accessibility': ['warn', { minScore: 0.95 }], // >95
        'categories:seo': ['error', { minScore: 0.95 }], // >95
        'categories:best-practices': ['warn', { minScore: 0.9 }], // >90
        
        // Core Web Vitals (from performance budget)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // <2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // <0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // <300ms
        
        // Resource size budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 972800 }], // <950KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 256000 }], // <250KB
        'resource-summary:document:size': ['warn', { maxNumericValue: 51200 }], // <50KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // <500KB
        'total-byte-weight': ['warn', { maxNumericValue: 1310720 }], // <1.25MB
        
        // DOM size (aligned with budget)
        'dom-size': ['warn', { maxNumericValue: 1800 }], // <1800 nodes
      },
    },
    upload: {
      target: 'temporary-public-storage', // Free Lighthouse CI storage
      // Alternative: Configure Vercel Analytics or custom server
      // serverBaseUrl: 'https://your-lhci-server.com',
    },
  },
};
