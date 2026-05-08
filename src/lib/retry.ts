/**
 * Retry logic with exponential backoff for API calls
 * Helps handle temporary network or server issues
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onAttempt?: (attempt: number, lastError: Error) => void;
}

/**
 * Retry an async function with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result from successful attempt
 * @throws Error from final failed attempt
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onAttempt,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Call callback if provided
      if (onAttempt) {
        onAttempt(attempt, lastError);
      }

      // Don't sleep after final attempt
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Increase delay for next attempt with cap
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      }
    }
  }

  // All attempts failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Retry a fetch request with exponential backoff
 * Only retries on network errors or 5xx server errors
 * Does NOT retry on 4xx client errors (400, 401, 403, 404, etc.)
 * 
 * @param url - URL to fetch
 * @param init - Fetch options
 * @param options - Retry configuration
 * @returns Fetch response (successful or final attempt's response)
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {},
): Promise<Response> {
  const {
    maxAttempts = 3,
    initialDelayMs = 500,
    maxDelayMs = 5000,
    backoffMultiplier = 2,
    onAttempt,
  } = options;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Check if we should retry (network error or 5xx)
      if (!response.ok) {
        lastResponse = response;

        if (attempt < maxAttempts) {
          if (onAttempt) {
            onAttempt(attempt, new Error(`HTTP ${response.status}`));
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * backoffMultiplier, maxDelayMs);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (onAttempt) {
        onAttempt(attempt, lastError);
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      }
    }
  }

  // Return last response if available, otherwise throw last error
  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('Fetch failed after retries');
}
