/**
 * SSR - Server-Side Rendering with On-Demand ISR
 * 
 * Strategy: Lazy Cache Warming
 * 1. Server starts immediately (CSS/JS loads in background)
 * 2. Cache is built on first request (when everything is ready)
 * 3. All subsequent requests served from cache (zero DB queries)
 */

import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteSettingsTable, navItemsTable, sectionsTable, servicesTable, projectsTable } from "@workspace/db";
import { getCache, setCache, peekCache, ISR_CACHE_KEYS, isISRCacheWarmed } from "@workspace/cache";
import { logger } from "./logger";

const publicDir = path.join(process.cwd(), "public");

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
  isWarming: boolean;
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
// Cache Operations
// =============================================================================

/**
 * Fetch SSR data with caching
 * If cache exists, return it. Otherwise, build it and cache.
 */
export async function fetchSSRData(): Promise<SSRSettings> {
  // Check cache first
  const cached = getCache<SSRSettings>(ISR_CACHE_KEYS.HOMEPAGE);
  if (cached) {
    return cached;
  }

  // Cache miss - build from database
  logger.info("Building SSR data cache...");
  const data = await fetchSSRDataFromDB();
  
  // Store in cache forever
  setCache(ISR_CACHE_KEYS.HOMEPAGE, data);
  
  return data;
}

/**
 * Force refresh SSR cache (called when admin updates content)
 */
export async function refreshSSRCache(): Promise<SSRSettings> {
  logger.info("Refreshing SSR cache...");
  const data = await fetchSSRDataFromDB();
  setCache(ISR_CACHE_KEYS.HOMEPAGE, data);
  return data;
}

// =============================================================================
// Page Rendering with Lazy Cache Warming
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
 * Render a page with Lazy Cache Warming
 * 
 * 1. Check if HTML is cached → return immediately (fast path)
 * 2. If not cached → build page, cache it, return it (first request is slower)
 * 3. All subsequent requests → served from cache (fast)
 */
export async function renderPage(filename: string): Promise<PageRenderResult> {
  const cacheKey = ISR_CACHE_KEYS.PAGE(filename);
  
  // Check if HTML is cached (zero DB queries, fast path)
  const cachedHtml = peekCache<string>(cacheKey);
  if (cachedHtml) {
    return { html: cachedHtml, fromCache: true, cacheKey, isWarming: false };
  }

  // Cache miss - this is the first request, need to build
  logger.info(`Building page ${filename}... (first request)`);
  
  const filePath = path.join(publicDir, filename);
  if (!fs.existsSync(filePath)) {
    return { html: "", fromCache: false, cacheKey, isWarming: false };
  }

  // Read HTML file (this has the complete CSS/JS references)
  let html = fs.readFileSync(filePath, "utf-8");

  // Fetch SSR data from DB
  const data = await fetchSSRData();

  // Inject data into HTML
  html = injectSSRData(html, data);

  // Cache the rendered HTML forever
  setCache(cacheKey, html);
  logger.info(`Page ${filename} cached successfully`);

  return { html, fromCache: false, cacheKey, isWarming: true };
}

/**
 * Render homepage
 */
export async function renderHomepage(): Promise<PageRenderResult> {
  return renderPage("index.html");
}

/**
 * Check if ISR cache is ready (has homepage cached)
 */
export function isISRReady(): boolean {
  return isISRCacheWarmed();
}

/**
 * Get cache status
 */
export function getISRStatus(): { ready: boolean; keys: string[] } {
  return {
    ready: isISRReady(),
    keys: Array.from(new Set([
      ISR_CACHE_KEYS.HOMEPAGE,
      ISR_CACHE_KEYS.PAGE("index.html")
    ]))
  };
}

// =============================================================================
// Page-specific Data
// =============================================================================

/**
 * Get page-specific data
 */
export async function fetchPageData(page: string): Promise<Record<string, unknown>> {
  const cacheKey = `page-data:${page}`;
  const cached = getCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    return cached;
  }

  const sectionsRaw = await db.select().from(sectionsTable).where(eq(sectionsTable.pageKey, page));
  const result: Record<string, unknown> = {};
  
  for (const s of sectionsRaw) {
    result[s.sectionKey] = {
      contentAr: s.contentAr,
      contentEn: s.contentEn,
    };
  }

  setCache(cacheKey, result);
  return result;
}
