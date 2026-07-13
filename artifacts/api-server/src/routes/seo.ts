/**
 * SEO Routes
 * Handles sitemap.xml and robots.txt generation
 */

import { Router, type Request, type Response } from "express";
import { generateSitemap, generateRobotsTxt, invalidateSEOCache } from "../lib/seo";

const router: Router = Router();

/**
 * GET /sitemap.xml
 * Returns dynamically generated sitemap
 */
router.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const sitemap = await generateSitemap();
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=1800"); // 30 minutes
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

/**
 * GET /robots.txt
 * Returns robots.txt configuration
 */
router.get("/robots.txt", (_req: Request, res: Response) => {
  const robotsTxt = generateRobotsTxt();
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400"); // 24 hours
  res.send(robotsTxt);
});

/**
 * POST /api/seo/refresh
 * Refresh SEO cache (admin only)
 */
router.post("/refresh", (_req: Request, res: Response) => {
  try {
    invalidateSEOCache();
    res.json({ success: true, message: "SEO cache invalidated" });
  } catch (error) {
    console.error("SEO cache refresh error:", error);
    res.status(500).json({ error: "Failed to refresh SEO cache" });
  }
});

export default router;
