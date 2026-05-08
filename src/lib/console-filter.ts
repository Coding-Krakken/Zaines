/**
 * Vercel Instrumentation Error Suppression
 * 
 * Suppresses known non-critical errors from Vercel's browser instrumentation:
 * - Zustand deprecation warnings (from Vercel's analytics script)
 * - csPostMessage timeout errors (from cross-frame communication)
 * 
 * These are benign warnings that don't affect application functionality.
 */

interface ConsoleMethod {
  (message?: any, ...optionalParams: any[]): void;
}

// Store original console methods
const originalWarn = console.warn;
const originalError = console.error;

// Patterns to suppress
const suppressionPatterns = [
  // Zustand deprecation from Vercel instrumentation
  /Default export is deprecated.*zustand/i,
  /import.*create.*from.*zustand/i,

  // Vercel csPostMessage timeout (harmless cross-frame communication)
  /E353.*csPostMessage.*timeout/i,
  /csPostMessage.*timeout/i,

  // Tracking Prevention messages (expected behavior)
  // Note: These are from browser, not our console, so won't be caught here
];

/**
 * Create a filtered console method that suppresses known warnings
 */
function createFilteredMethod(originalMethod: ConsoleMethod): ConsoleMethod {
  return function (message?: any, ...optionalParams: any[]): void {
    // Convert message to string for pattern matching
    const messageStr = String(message || "");
    
    // Check if this matches any suppression pattern
    const shouldSuppress = suppressionPatterns.some((pattern) =>
      pattern.test(messageStr),
    );

    if (!shouldSuppress) {
      // Pass through to original console method
      originalMethod.call(console, message, ...optionalParams);
    }
    // Otherwise silently suppress
  };
}

/**
 * Apply console filtering in development and production
 */
if (typeof window !== "undefined") {
  console.warn = createFilteredMethod(originalWarn);
  console.error = createFilteredMethod(originalError);

  // Also suppress errors from uncaught promise rejections related to Vercel
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = String(event.reason || "");
      if (
        /csPostMessage.*timeout/i.test(reason) ||
        /E353/i.test(reason)
      ) {
        // Prevent browser from reporting this error
        event.preventDefault();
      }
    },
    true, // Use capture phase to intercept before other handlers
  );
}

export function enableConsoleFiltering(): void {
  // Explicitly enable filtering (this runs on import)
  // Nothing to do here - filtering is applied above
}
