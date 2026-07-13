/**
 * In-Memory Cache System
 * On-Demand ISR (Incremental Static Regeneration)
 * 
 * Strategy:
 * 1. Cache-Forever: Data is cached once and stays forever until explicitly invalidated
 * 2. On-Demand Rebuild: When admin updates content, cache is destroyed and rebuilt
 * 3. Zero DB Queries for Visitors: All data served from cache, no database queries on page load
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hitCount: number;
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
  // Increment hit count for monitoring
  entry.hitCount++;
  return entry.data as T;
}

/**
 * Set a value in cache
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    hitCount: 0,
  });
}

/**
 * Check if key exists and return it (without incrementing hit count)
 */
export function peekCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  return entry.data as T;
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
export function getCacheStats(): { 
  keys: string[]; 
  size: number;
  details: Array<{ key: string; age: number; hits: number }>;
} {
  const now = Date.now();
  return {
    keys: Array.from(cache.keys()),
    size: cache.size,
    details: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.round((now - entry.timestamp) / 1000),
      hits: entry.hitCount,
    })),
  };
}

/**
 * Webhook secret for cache invalidation
 */
const CACHE_WEBHOOK_SECRET = process.env.CACHE_WEBHOOK_SECRET || "dev-secret-change-me";

/**
 * Validate the webhook token from request headers
 */
export function validateCacheWebhookToken(authHeader: string | undefined): boolean {
  if (!authHeader) {
    return false;
  }
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  return token === CACHE_WEBHOOK_SECRET;
}

// =============================================================================
// On-Demand ISR Specific Functions
// =============================================================================

/**
 * Cache keys for different page types
 */
export const ISR_CACHE_KEYS = {
  HOMEPAGE: "isr:homepage",
  PAGE: (slug: string) => `isr:page:${slug}`,
  PROJECTS: "isr:projects",
  PROJECT: (slug: string) => `isr:project:${slug}`,
  SERVICES: "isr:services",
  CONTACT: "isr:contact",
  ALL_HTML: "isr:all:html",
} as const;

/**
 * Clear all ISR cache entries
 */
export function clearISRCache(): void {
  for (const key of cache.keys()) {
    if (key.startsWith("isr:")) {
      cache.delete(key);
    }
  }
}

/**
 * Check if ISR cache is warmed (has data)
 */
export function isISRCacheWarmed(): boolean {
  return hasCache(ISR_CACHE_KEYS.HOMEPAGE);
}
