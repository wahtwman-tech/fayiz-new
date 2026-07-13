import { Router, type IRouter, type Request, type Response } from "express";
import { clearAllCache, getCacheStats, validateCacheWebhookToken } from "@workspace/cache";
import { refreshSSRCache } from "../lib/ssr";

const router: IRouter = Router();

/**
 * POST /api/cache-clear
 * 
 * Webhook endpoint to clear all cache and optionally refresh SSR data.
 * Used by the admin panel after updating content to ensure visitors see the latest data.
 * 
 * Security:
 * - Requires x-webhook-token header with the correct secret
 * - The token should be the same as CACHE_WEBHOOK_SECRET environment variable
 * 
 * Headers:
 *   x-webhook-token: <your-webhook-secret>
 * 
 * Body (optional):
 *   {
 *     "refreshSSR": true  // Optional: if true, also pre-warms the cache with fresh data
 *   }
 * 
 * Responses:
 *   200: { "success": true, "message": "Cache cleared" }
 *   401: { "error": "Invalid or missing webhook token" }
 *   500: { "error": "Failed to clear cache" }
 */
router.post("/cache-clear", async (req: Request, res: Response): Promise<void> => {
  // Validate webhook token from x-webhook-token header
  const webhookToken = req.headers["x-webhook-token"] as string | undefined;
  
  if (!validateCacheWebhookToken(webhookToken)) {
    res.status(401).json({
      error: "Invalid or missing webhook token",
    });
    return;
  }

  try {
    // Get stats before clearing (for logging)
    const statsBefore = getCacheStats();
    
    // Clear all cache
    clearAllCache();
    
    // Check if we should also refresh SSR cache (pre-warm it)
    const body = req.body as { refreshSSR?: boolean } | undefined;
    if (body?.refreshSSR) {
      // Pre-warm cache with fresh data from database
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
 * In production, you might want to protect this or remove it.
 */
router.get("/cache-stats", (_req: Request, res: Response): void => {
  res.json(getCacheStats());
});

export default router;
