/**
 * Cache Invalidation Client
 * Used by the frontend admin panel to trigger cache refresh after content updates
 */

import { customFetch } from "./custom-fetch";

export interface CacheClearResponse {
  success: boolean;
  message: string;
  statsBefore?: number;
}

export interface CacheClearOptions {
  /** Secret token for webhook authentication */
  webhookToken: string;
  /** If true, also pre-warms the cache with fresh data from database */
  refreshSSR?: boolean;
}

/**
 * Clear server cache and optionally refresh SSR data
 * 
 * @param options - Configuration options including the webhook token
 * @returns Promise resolving to the cache clear response
 * 
 * @example
 * ```typescript
 * const result = await clearServerCache({
 *   webhookToken: "your-secret-token",
 *   refreshSSR: true
 * });
 * 
 * if (result.success) {
 *   console.log("Cache cleared successfully!");
 * }
 * ```
 */
export async function clearServerCache(options: CacheClearOptions): Promise<CacheClearResponse> {
  const { webhookToken, refreshSSR = true } = options;

  return customFetch<CacheClearResponse>("/api/cache-clear", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-token": webhookToken,
    },
    body: JSON.stringify({ refreshSSR }),
  });
}

/**
 * Get cache statistics (for debugging)
 * 
 * @returns Promise resolving to cache statistics
 */
export async function getCacheStats(): Promise<{ keys: string[]; size: number }> {
  return customFetch<{ keys: string[]; size: number }>("/api/cache-stats", {
    method: "GET",
  });
}
