/**
 * SSR - Server-Side Rendering with On-Demand ISR
 * 
 * Strategy: On-Demand Incremental Static Regeneration
 * 1. Cache-Forever: Data is cached once at startup and stays forever
 * 2. On-Demand Rebuild: When admin updates content, cache is destroyed and rebuilt
 * 3. Zero DB Queries for Visitors: All data served from cache
 */

import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteSettingsTable, navItemsTable, sectionsTable, servicesTable, projectsTable } from "@workspace/db";
import { getCache, setCache, peekCache, ISR_CACHE_KEYS, isISRCacheWarmed } from "@workspace/cache";
import { logger } from "./logger";

const publicDir = path.join(process.cwd(), "public");

// Legacy cache key for backwards compatibility
const SSR_CACHE_KEY = "ssr:homepage";

export interface SSRSettings {
  settings: Record<string, string>;
  nav: Array<{
    id: number;
    labelAr: string;
    labelEn: string;
    url: string;
    sortOrder: number;
    isActive: boolean;
    target: string;
  }>;
  services: Array<{
    id: number;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
  }>;
  featuredProjects: Array<{
    id: number;
    titleAr: string;
    titleEn: string;
    slug: string;
    category: string;
    coverImage: string;
    coverImageData: string | null;
  }>;
  aboutSections: Record<string, string>;
}

export interface PageRenderResult {
  html: string;
  fromCache: boolean;
  cacheKey: string;
}

// =============================================================================
// Database Fetching Functions
// =============================================================================

async function fetchSSRDataFromDB(): Promise<SSRSettings> {
  // Fetch settings
  const settingsRaw = await db.select().from(siteSettingsTable);
  const settings: Record<string, string> = {};
  for (const s of settingsRaw) {
    settings[s.key] = s.value;
  }

  // Fetch nav items
  const navRaw = await db.select().from(navItemsTable).orderBy(navItemsTable.sortOrder);
  const nav = navRaw.map((n) => ({
    id: n.id,
    labelAr: n.labelAr,
    labelEn: n.labelEn,
    url: n.url,
    sortOrder: n.sortOrder,
    isActive: n.isActive,
    target: n.target || "_self",
  }));

  // Fetch services
  const servicesRaw = await db.select().from(servicesTable).orderBy(servicesTable.sortOrder);
  const services = servicesRaw.map((s) => ({
    id: s.id,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    descriptionAr: s.descriptionAr,
    descriptionEn: s.descriptionEn,
  }));

  // Fetch featured projects
  const projectsRaw = await db.select().from(projectsTable).where(eq(projectsTable.isFeatured, true)).limit(6);
  const featuredProjects = projectsRaw.map((p) => ({
    id: Number(p.id),
    titleAr: p.titleAr || "",
    titleEn: p.titleEn || "",
    slug: String(p.id),
    category: p.category || "",
    coverImage: p.coverImage || "",
    coverImageData: (p as Record<string, unknown>).cover_image_data as string | null || null,
  }));

  // Fetch about sections
  const sectionsRaw = await db.select().from(sectionsTable).where(eq(sectionsTable.pageKey, "about"));
  const aboutSections: Record<string, string> = {};
  for (const s of sectionsRaw) {
    aboutSections[s.sectionKey] = s.contentAr || s.contentEn || "";
  }

  return { settings, nav, services, featuredProjects, aboutSections };
}

// =============================================================================
// Cache Operations (Cache-Forever Strategy)
// =============================================================================

/**
 * Fetch all data needed for SSR with caching
 * Data is fetched from cache if available, otherwise from database
 */
export async function fetchSSRData(): Promise<SSRSettings> {
  // Check ISR cache first
  const cached = getCache<SSRSettings>(ISR_CACHE_KEYS.HOMEPAGE);
  if (cached) {
    return cached;
  }

  // Check legacy cache
  const legacyCached = getCache<SSRSettings>(SSR_CACHE_KEY);
  if (legacyCached) {
    // Migrate to new cache key
    setCache(ISR_CACHE_KEYS.HOMEPAGE, legacyCached);
    return legacyCached;
  }

  // Cache miss - fetch from database
  logger.info("SSR cache miss - fetching from database");
  const data = await fetchSSRDataFromDB();
  
  // Store in both caches for compatibility
  setCache(ISR_CACHE_KEYS.HOMEPAGE, data);
  setCache(SSR_CACHE_KEY, data);
  
  return data;
}

/**
 * Force refresh SSR cache (called when admin updates content)
 */
export async function refreshSSRCache(): Promise<SSRSettings> {
  logger.info("Refreshing SSR cache from database");
  const data = await fetchSSRDataFromDB();
  setCache(ISR_CACHE_KEYS.HOMEPAGE, data);
  setCache(SSR_CACHE_KEY, data);
  return data;
}

// =============================================================================
// On-Demand ISR - Page Rendering
// =============================================================================

/**
 * Inject SSR data into HTML head
 */
export function injectSSRData(html: string, data: SSRSettings): string {
  const scriptContent = `window.__SSR_DATA__ = ${JSON.stringify(data)};`;

  // Insert before </head>
  const injectPoint = html.indexOf("</head>");
  if (injectPoint === -1) {
    return html;
  }

  const script = `\n    <script>${scriptContent}</script>\n  `;
  return html.slice(0, injectPoint) + script + html.slice(injectPoint);
}

/**
 * Render a page with ISR caching
 * Returns cached HTML if available, otherwise builds and caches it
 */
export async function renderPage(filename: string): Promise<PageRenderResult> {
  const cacheKey = ISR_CACHE_KEYS.PAGE(filename);
  
  // Check cache first (zero DB queries if cached)
  const cachedHtml = peekCache<string>(cacheKey);
  if (cachedHtml) {
    return { html: cachedHtml, fromCache: true, cacheKey };
  }

  // Cache miss - build page
  logger.info(`Building page ${filename} (cache miss)`);
  
  const filePath = path.join(publicDir, filename);
  if (!fs.existsSync(filePath)) {
    return { html: "", fromCache: false, cacheKey };
  }

  // Read HTML file
  let html = fs.readFileSync(filePath, "utf-8");

  // Fetch SSR data
  const data = await fetchSSRData();

  // Inject data into HTML
  html = injectSSRData(html, data);

  // Cache the rendered HTML forever
  setCache(cacheKey, html);

  return { html, fromCache: false, cacheKey };
}

/**
 * Render homepage with ISR caching
 */
export async function renderHomepage(): Promise<PageRenderResult> {
  return renderPage("index.html");
}

// =============================================================================
// Server Startup - Pre-warm Cache
// =============================================================================

/**
 * Pre-warm all ISR caches at server startup
 * This ensures visitors get cached content immediately
 */
export async function prewarmISRCache(): Promise<void> {
  logger.info("Pre-warming ISR cache...");
  const startTime = Date.now();
  
  try {
    // Pre-warm homepage data
    await fetchSSRData();
    
    // Pre-warm homepage HTML
    await renderPage("index.html");
    
    const elapsed = Date.now() - startTime;
    logger.info(`ISR cache warmed in ${elapsed}ms`);
  } catch (error) {
    logger.error({ error }, "Failed to pre-warm ISR cache");
  }
}

/**
 * Check if ISR is ready
 */
export function isISRReady(): boolean {
  return isISRCacheWarmed();
}

// =============================================================================
// Page-specific Data (still cached)
// =============================================================================

/**
 * Get page-specific data
 */
export async function fetchPageData(page: string): Promise<Record<string, unknown>> {
  // Try cache first
  const cacheKey = `page-data:${page}`;
  const cached = getCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const sectionsRaw = await db.select().from(sectionsTable).where(eq(sectionsTable.pageKey, page));
  const result: Record<string, unknown> = {};
  
  for (const s of sectionsRaw) {
    result[s.sectionKey] = {
      contentAr: s.contentAr,
      contentEn: s.contentEn,
    };
  }

  // Cache the result
  setCache(cacheKey, result);
  return result;
}
