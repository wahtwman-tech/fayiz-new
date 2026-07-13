import { Router, type IRouter, type Request, type Response } from "express";
import { clearAllCache, clearISRCache, getCacheStats, validateCacheWebhookToken } from "@workspace/cache";
import { refreshSSRCache, isISRReady, getISRStatus, renderHomepage } from "../lib/ssr";

const router: IRouter = Router();

/**
 * POST /api/admin/cache-rebuild
 * 
 * Admin endpoint to rebuild ISR cache after content updates.
 * Destroys old cache and rebuilds with fresh data.
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
    const startTime = Date.now();
    
    // Step 1: Clear ISR cache (destroy old cached content)
    clearISRCache();
    
    // Step 2: Rebuild cache (render homepage which will cache it)
    await renderHomepage();
    
    const elapsed = Date.now() - startTime;
    const status = getISRStatus();
    
    res.json({
      success: true,
      message: "Cache rebuilt successfully",
      timing: {
        rebuildMs: elapsed,
        cacheReady: status.ready
      },
      stats: getCacheStats()
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
 */
router.get("/admin/cache-status", (_req: Request, res: Response): void => {
  res.json({
    ...getISRStatus(),
    stats: getCacheStats(),
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// Legacy Endpoints
// =============================================================================

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

router.get("/cache-stats", (_req: Request, res: Response): void => {
  res.json({
    ...getCacheStats(),
    isrReady: isISRReady()
  });
});

export default router;
