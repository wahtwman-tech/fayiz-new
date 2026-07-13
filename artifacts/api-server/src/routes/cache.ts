import { Router, type IRouter, type Request, type Response } from "express";
import { clearAllCache, clearISRCache, getCacheStats, validateCacheWebhookToken } from "@workspace/cache";
import { refreshSSRCache, prewarmISRCache, isISRReady } from "../lib/ssr";

const router: IRouter = Router();

/**
 * POST /api/admin/cache-rebuild
 * 
 * Admin endpoint to rebuild ISR cache after content updates.
 * This is called by the admin panel when content is updated.
 * 
 * Security:
 * - Requires x-webhook-token header with the correct secret
 * 
 * Headers:
 *   x-webhook-token: <your-webhook-secret>
 * 
 * Body (optional):
 *   {
 *     "fullRebuild": true  // Optional: if true, pre-warms all pages
 *   }
 * 
 * Responses:
 *   200: { 
 *     "success": true, 
 *     "message": "Cache rebuilt successfully",
 *     "stats": { ... }
 *   }
 *   401: { "error": "Invalid or missing webhook token" }
 *   500: { "error": "Failed to rebuild cache" }
 */
router.post("/admin/cache-rebuild", async (req: Request, res: Response): Promise<void> => {
  const webhookToken = req.headers["x-webhook-token"] as string | undefined;
  
  if (!validateCacheWebhookToken(webhookToken)) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing x-webhook-token header"
    });
    return;
  }

  try {
    const body = req.body as { fullRebuild?: boolean } | undefined;
    const startTime = Date.now();
    
    // Step 1: Clear ISR cache (destroy old cached content)
    clearISRCache();
    
    // Step 2: Rebuild cache (fetch fresh data from DB and cache it)
    if (body?.fullRebuild) {
      await prewarmISRCache();
    } else {
      await refreshSSRCache();
    }
    
    const elapsed = Date.now() - startTime;
    const stats = getCacheStats();
    
    res.json({
      success: true,
      message: body?.fullRebuild 
        ? "Full cache rebuild completed" 
        : "Cache invalidated and refreshed",
      timing: {
        rebuildMs: elapsed,
        cacheReady: isISRReady()
      },
      stats
    });
  } catch (err) {
    console.error("Cache rebuild error:", err);
    res.status(500).json({
      error: "Failed to rebuild cache",
      message: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/cache-clear
 * 
 * Admin endpoint to clear ISR cache without rebuilding.
 * Use this when you want to invalidate cache but handle rebuild separately.
 * 
 * Headers:
 *   x-webhook-token: <your-webhook-secret>
 * 
 * Responses:
 *   200: { "success": true, "message": "Cache cleared" }
 */
router.post("/admin/cache-clear", async (req: Request, res: Response): Promise<void> => {
  const webhookToken = req.headers["x-webhook-token"] as string | undefined;
  
  if (!validateCacheWebhookToken(webhookToken)) {
    res.status(401).json({
      error: "Unauthorized"
    });
    return;
  }

  try {
    const statsBefore = getCacheStats();
    clearISRCache();
    
    res.json({
      success: true,
      message: "ISR cache cleared",
      statsBefore: statsBefore.size
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to clear cache"
    });
  }
});

/**
 * GET /api/admin/cache-status
 * 
 * Admin endpoint to check ISR cache status.
 * 
 * Responses:
 *   200: { 
 *     "ready": boolean,
 *     "stats": { ... }
 *   }
 */
router.get("/admin/cache-status", (_req: Request, res: Response): void => {
  res.json({
    ready: isISRReady(),
    stats: getCacheStats(),
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// Legacy Endpoints (for backwards compatibility)
// =============================================================================

/**
 * POST /api/cache-clear
 * 
 * Legacy endpoint - redirects to /api/admin/cache-clear
 */
router.post("/cache-clear", async (req: Request, res: Response): Promise<void> => {
  const webhookToken = req.headers["x-webhook-token"] as string | undefined;
  
  if (!validateCacheWebhookToken(webhookToken)) {
    res.status(401).json({
      error: "Invalid or missing webhook token",
    });
    return;
  }

  try {
    const statsBefore = getCacheStats();
    clearAllCache();
    
    const body = req.body as { refreshSSR?: boolean } | undefined;
    if (body?.refreshSSR) {
      await refreshSSRCache();
    }

    res.json({
      success: true,
      message: body?.refreshSSR 
        ? "Cache cleared and SSR cache refreshed" 
        : "Cache cleared",
      statsBefore: statsBefore.size,
    });
  } catch (err) {
    console.error("Cache clear error:", err);
    res.status(500).json({
      error: "Failed to clear cache",
    });
  }
});

/**
 * GET /api/cache-stats
 * 
 * Debug endpoint to view cache status.
 */
router.get("/cache-stats", (_req: Request, res: Response): void => {
  res.json({
    ...getCacheStats(),
    isrReady: isISRReady()
  });
});

export default router;
