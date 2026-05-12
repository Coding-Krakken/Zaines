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
const originalLog = console.log;

// Patterns to suppress
const suppressionPatterns = [
  // Zustand deprecation from Vercel instrumentation
  /\[DEPRECATED\].*Default export is deprecated/i,
  /Default export is deprecated/i,
  /Default export is deprecated.*zustand/i,
  /import.*create.*from.*zustand/i,
  /import\s*\{\s*create\s*\}\s*from\s*['\"]zustand['\"]/i,

  // Vercel csPostMessage timeout (harmless cross-frame communication)
  /E353.*csPostMessage.*timeout/i,
  /csPostMessage.*timeout/i,

  // Browser/framework preload noise
  /preloaded using link preload but not used within a few seconds/i,

  // Tracking Prevention messages (expected behavior)
  // Note: These are from browser, not our console, so won't be caught here
];

/**
 * Create a filtered console method that suppresses known warnings
 */
function createFilteredMethod(originalMethod: ConsoleMethod): ConsoleMethod {
  return function (message?: any, ...optionalParams: any[]): void {
    // Join all args to catch format-string warnings where key text lives
    // outside the first argument.
    const messageStr = [message, ...optionalParams]
      .map((part) => String(part ?? ""))
      .join(" ");
    
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
  console.log = createFilteredMethod(originalLog);

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
