/**
 * SSR - Server-Side Rendering utilities
 * Injects data into HTML to prevent flash of wrong content
 * Uses in-memory caching for performance optimization
 */

import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteSettingsTable, navItemsTable, sectionsTable, servicesTable, projectsTable } from "@workspace/db";
import { getCache, setCache } from "@workspace/cache";

const publicDir = path.join(process.cwd(), "public");

// Cache key for SSR data
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

/**
 * Fetch all data needed for SSR with caching
 * Data is fetched from cache if available, otherwise from database
 */
export async function fetchSSRData(): Promise<SSRSettings> {
  // Check cache first
  const cached = getCache<SSRSettings>(SSR_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from database
  const data = await fetchSSRDataFromDB();
  
  // Store in cache
  setCache(SSR_CACHE_KEY, data);
  
  return data;
}

/**
 * Fetch all data directly from database (bypasses cache)
 * Called on cache miss or when explicitly refreshing
 */
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

/**
 * Force refresh SSR cache (called when admin updates content)
 */
export async function refreshSSRCache(): Promise<SSRSettings> {
  const data = await fetchSSRDataFromDB();
  setCache(SSR_CACHE_KEY, data);
  return data;
}

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
 * Read HTML file and inject SSR data
 */
export async function renderPage(filename: string): Promise<string> {
  const filePath = path.join(publicDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return "";
  }

  // Read HTML file
  let html = fs.readFileSync(filePath, "utf-8");

  // Fetch SSR data
  const data = await fetchSSRData();

  // Inject data into HTML
  html = injectSSRData(html, data);

  return html;
}

/**
 * Get page-specific data
 */
export async function fetchPageData(page: string): Promise<Record<string, unknown>> {
  const sectionsRaw = await db.select().from(sectionsTable).where(eq(sectionsTable.pageKey, page));
  const result: Record<string, unknown> = {};
  
  for (const s of sectionsRaw) {
    result[s.sectionKey] = {
      contentAr: s.contentAr,
      contentEn: s.contentEn,
    };
  }

  return result;
}
