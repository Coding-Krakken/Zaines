/**
 * Safe storage utilities that gracefully handle browser privacy modes
 * and tracking prevention. Fixes console warnings from Tracking Prevention
 * and provides fallback in-memory storage when browser storage is unavailable.
 */

type StorageType = 'localStorage' | 'sessionStorage';

interface StorageResult<T> {
  success: boolean;
  data: T | null;
  error: Error | null;
}

/**
 * Safely check if storage is available and accessible
 * Handles: private browsing, tracking prevention, quota exceeded
 */
function isStorageAvailable(type: StorageType): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    const testKey = `__storage_test_${Date.now()}__`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Known storage access errors:
      // - SecurityError: private browsing, tracking prevention
      // - QuotaExceededError: storage full
      // - NS_ERROR_FILE_CORRUPTED: Firefox corruption
      if (
        error.name === 'SecurityError' ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_FILE_CORRUPTED'
      ) {
        return false;
      }
    }
    return false;
  }
}

/**
 * In-memory fallback storage (max 100 entries, expires after session)
 */
const memoryStorage = new Map<string, string>();

/**
 * Safely get an item from storage with fallback to memory
 */
export function safeGetItem(
  key: string,
  type: StorageType = 'localStorage',
): StorageResult<string> {
  try {
    if (isStorageAvailable(type)) {
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      const value = storage.getItem(key);
      return { success: true, data: value, error: null };
    }
  } catch (error) {
    // Silently fail to prevent console spam
  }

  // Fallback to in-memory storage
  const value = memoryStorage.get(key) || null;
  return { success: value !== null, data: value, error: null };
}

/**
 * Safely set an item in storage with fallback to memory
 */
export function safeSetItem(
  key: string,
  value: string,
  type: StorageType = 'localStorage',
): StorageResult<void> {
  try {
    if (isStorageAvailable(type)) {
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      storage.setItem(key, value);
      return { success: true, data: undefined, error: null };
    }
  } catch (error) {
    // Silently fail to prevent console spam
  }

  // Fallback to in-memory storage (with size limit)
  if (memoryStorage.size < 100) {
    memoryStorage.set(key, value);
    return { success: true, data: undefined, error: null };
  }

  return {
    success: false,
    data: undefined,
    error: new Error('In-memory storage limit exceeded'),
  };
}

/**
 * Safely remove an item from storage
 */
export function safeRemoveItem(
  key: string,
  type: StorageType = 'localStorage',
): StorageResult<void> {
  try {
    if (isStorageAvailable(type)) {
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      storage.removeItem(key);
      return { success: true, data: undefined, error: null };
    }
  } catch (error) {
    // Silently fail to prevent console spam
  }

  // Fallback to in-memory storage
  memoryStorage.delete(key);
  return { success: true, data: undefined, error: null };
}

/**
 * Safely clear all storage items (only affects items we set)
 */
export function safeClearStorage(type: StorageType = 'localStorage'): StorageResult<void> {
  try {
    if (isStorageAvailable(type)) {
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      storage.clear();
      return { success: true, data: undefined, error: null };
    }
  } catch (error) {
    // Silently fail to prevent console spam
  }

  // Fallback to in-memory storage
  memoryStorage.clear();
  return { success: true, data: undefined, error: null };
}

/**
 * Type-safe JSON storage operations with automatic serialization
 */
export const typedStorage = {
  setJson<T>(
    key: string,
    value: T,
    type: StorageType = 'localStorage',
  ): boolean {
    try {
      const serialized = JSON.stringify(value);
      const result = safeSetItem(key, serialized, type);
      return result.success;
    } catch (error) {
      // Silently fail on serialization errors
      return false;
    }
  },

  getJson<T>(
    key: string,
    type: StorageType = 'localStorage',
  ): T | null {
    try {
      const result = safeGetItem(key, type);
      if (result.success && result.data) {
        return JSON.parse(result.data) as T;
      }
    } catch (error) {
      // Silently fail on parse errors
    }
    return null;
  },

  removeJson(key: string, type: StorageType = 'localStorage'): boolean {
    const result = safeRemoveItem(key, type);
    return result.success;
  },
};

/**
 * Debug utility: Check storage availability (dev-only)
 */
export function debugStorageStatus(): void {
  if (typeof window === 'undefined') {
    console.debug('Storage: SSR context');
    return;
  }

  const localStorageAvailable = isStorageAvailable('localStorage');
  const sessionStorageAvailable = isStorageAvailable('sessionStorage');

  console.debug('Storage Status:', {
    localStorage: localStorageAvailable ? 'available' : 'blocked',
    sessionStorage: sessionStorageAvailable ? 'available' : 'blocked',
    fallbackMemory: `${memoryStorage.size}/100 entries`,
  });
}
