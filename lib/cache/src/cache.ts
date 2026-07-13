/**
 * In-Memory Cache System
 * Event-driven caching - cache is only invalidated when admin updates content
 * No time-based expiration or polling
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Generic in-memory cache store
 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a value from cache
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  return entry.data as T;
}

/**
 * Set a value in cache
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear a specific cache entry
 */
export function clearCache(key: string): boolean {
  return cache.delete(key);
}

/**
 * Clear all cache entries (useful for bulk updates)
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Check if a key exists in cache
 */
export function hasCache(key: string): boolean {
  return cache.has(key);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { keys: string[]; size: number } {
  return {
    keys: Array.from(cache.keys()),
    size: cache.size,
  };
}

/**
 * Webhook secret for cache invalidation
 * In production, this should be loaded from environment variables
 */
const CACHE_WEBHOOK_SECRET = process.env.CACHE_WEBHOOK_SECRET || "change-me-in-production";

/**
 * Validate the webhook token from request headers
 */
export function validateCacheWebhookToken(authHeader: string | undefined): boolean {
  if (!authHeader) {
    return false;
  }
  
  // Support both "Bearer token" and "token" formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  
  return token === CACHE_WEBHOOK_SECRET;
}
