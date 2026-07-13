/**
 * SEO Module - Server-Side SEO Optimization
 * Generates dynamic meta tags, Open Graph, Twitter Cards, and structured data
 * All tags are injected server-side for optimal crawler visibility
 */

import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteSettingsTable, projectsTable, servicesTable, navItemsTable } from "@workspace/db";
import { getCache, setCache } from "@workspace/cache";

// ============================================================================
// Types
// ============================================================================

export interface SEOMeta {
  title: string;
  titleAr: string;
  titleEn: string;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  keywords: string[];
  keywordsAr: string[];
  keywordsEn: string[];
  ogImage: string;
  ogImageSecure: string;
  ogType: "website" | "article" | "profile";
  canonicalUrl: string;
  robots: string;
  structuredData?: Record<string, unknown>;
}

export interface PageSEOConfig {
  pageKey: string;
  defaultTitleAr: string;
  defaultTitleEn: string;
  defaultDescAr: string;
  defaultDescEn: string;
  defaultKeywordsAr: string[];
  defaultKeywordsEn: string[];
  type: "website" | "article" | "profile";
  hasDynamicContent?: boolean;
}

// ============================================================================
// Page SEO Configurations
// ============================================================================

const PAGE_CONFIGS: Record<string, PageSEOConfig> = {
  home: {
    pageKey: "home",
    defaultTitleAr: "مطور ويب محترف | حلول رقمية متكاملة",
    defaultTitleEn: "Professional Web Developer | Complete Digital Solutions",
    defaultDescAr: "أنا مطور ويب متخصص في بناء مواقع إلكترونية احترافية، متاجر إلكترونية، ولوحات تحكم مخصصة. حلول رقمية متكاملة تناسب احتياجاتك.",
    defaultDescEn: "Professional web developer specializing in building websites, e-commerce stores, and custom dashboards. Complete digital solutions tailored to your needs.",
    defaultKeywordsAr: ["مطور ويب", "مواقع إلكترونية", "متاجر إلكترونية", "تطوير ويب", "لوحات تحكم"],
    defaultKeywordsEn: ["web developer", "websites", "e-commerce", "web development", "dashboards"],
    type: "website",
  },
  about: {
    pageKey: "about",
    defaultTitleAr: "من أنا | مطور ويب محترف",
    defaultTitleEn: "About Me | Professional Web Developer",
    defaultDescAr: "تعرف على مطور الويب المحترف. خبرة واسعة في بناء حلول رقمية متكاملة وتحويل الأفكار إلى واقع رقمي ناجح.",
    defaultDescEn: "Learn about the professional web developer. Extensive experience in building complete digital solutions and turning ideas into successful digital reality.",
    defaultKeywordsAr: ["من أنا", "مطور ويب", "نبذة عني", "الخبرة", "المهارات"],
    defaultKeywordsEn: ["about", "web developer", "bio", "experience", "skills"],
    type: "profile",
  },
  services: {
    pageKey: "services",
    defaultTitleAr: "خدماتي | تطوير مواقع ويب احترافية",
    defaultTitleEn: "Services | Professional Web Development",
    defaultDescAr: "خدمات تطوير المواقع الإلكترونية، المتاجر الإلكترونية، ولوحات التحكم المخصصة. حلول تقنية متكاملة لنجاح أعمالك.",
    defaultDescEn: "Website development, e-commerce stores, and custom dashboard services. Complete technical solutions for your business success.",
    defaultKeywordsAr: ["خدمات", "تطوير ويب", "تصميم مواقع", "متاجر إلكترونية", "لوحات تحكم"],
    defaultKeywordsEn: ["services", "web development", "web design", "e-commerce", "dashboards"],
    type: "website",
  },
  portfolio: {
    pageKey: "portfolio",
    defaultTitleAr: "مشاريعي | معرض أعمال مطور ويب",
    defaultTitleEn: "Portfolio | Web Developer Projects",
    defaultDescAr: "استعرض مجموعة متنوعة من مشاريعي في تطوير المواقع الإلكترونية، المتاجر الإلكترونية، والتطبيقات الويب المخصصة.",
    defaultDescEn: "Browse through my diverse portfolio of website development, e-commerce stores, and custom web application projects.",
    defaultKeywordsAr: ["مشاريع", "أعمال", "معرض أعمال", "مشاريع سابقة", "نماذج أعمال"],
    defaultKeywordsEn: ["portfolio", "projects", "work", "portfolio showcase", "web projects"],
    type: "website",
  },
  contact: {
    pageKey: "contact",
    defaultTitleAr: "تواصل معي | مطور ويب محترف",
    defaultTitleEn: "Contact Me | Professional Web Developer",
    defaultDescAr: "تواصل معي الآن لمشروعك القادم. خدمات تطوير المواقع الإلكترونية والاستشارات التقنية متاحة.",
    defaultDescEn: "Get in touch now for your next project. Website development services and technical consultations available.",
    defaultKeywordsAr: ["تواصل", "اتصل", "استفسار", "طلب خدمة", "استشارة"],
    defaultKeywordsEn: ["contact", "get in touch", "inquiry", "hire", "consultation"],
    type: "website",
  },
  project: {
    pageKey: "project",
    defaultTitleAr: "تفاصيل المشروع | مطور ويب",
    defaultTitleEn: "Project Details | Web Developer",
    defaultDescAr: "تفاصيل المشروع - شاهد كيف أحول الأفكار إلى حلول رقمية ناجحة.",
    defaultDescEn: "Project details - See how I turn ideas into successful digital solutions.",
    defaultKeywordsAr: ["مشروع", "دراسة حالة", "تفاصيل المشروع"],
    defaultKeywordsEn: ["project", "case study", "project details"],
    type: "article",
    hasDynamicContent: true,
  },
  page: {
    pageKey: "page",
    defaultTitleAr: "صفحة | مطور ويب",
    defaultTitleEn: "Page | Web Developer",
    defaultDescAr: "صفحة معلومات.",
    defaultDescEn: "Information page.",
    defaultKeywordsAr: ["صفحة", "معلومات"],
    defaultKeywordsEn: ["page", "information"],
    type: "article",
    hasDynamicContent: true,
  },
};

// ============================================================================
// Settings Cache
// ============================================================================

const SEO_SETTINGS_CACHE_KEY = "seo:settings";

interface SEOSettings {
  siteNameAr: string;
  siteNameEn: string;
  siteDescriptionAr: string;
  siteDescriptionEn: string;
  defaultOgImage: string;
  baseUrl: string;
  defaultLang: string;
}

async function fetchSEOSettings(): Promise<SEOSettings> {
  const cached = getCache<SEOSettings>(SEO_SETTINGS_CACHE_KEY);
  if (cached) return cached;

  const settingsRaw = await db.select().from(siteSettingsTable);
  const settings: Record<string, string> = {};
  for (const s of settingsRaw) {
    settings[s.key] = s.value;
  }

  const result: SEOSettings = {
    siteNameAr: settings["site_title_ar"] || "فايز محمد",
    siteNameEn: settings["site_title_en"] || "Fayez Mohammed",
    siteDescriptionAr: settings["site_description_ar"] || "",
    siteDescriptionEn: settings["site_description_en"] || "",
    defaultOgImage: settings["about_cover_image"] 
      ? (settings["about_cover_image"].startsWith("data:") 
          ? `https://i.ibb.co/LdD44pTY/download.jpg` 
          : settings["about_cover_image"])
      : "https://i.ibb.co/LdD44pTY/download.jpg",
    baseUrl: process.env.BASE_URL || "https://fayiz-mohammad.up.railway.app",
    defaultLang: settings["default_lang"] || "ar",
  };

  setCache(SEO_SETTINGS_CACHE_KEY, result);
  return result;
}

// ============================================================================
// Meta Tags Generation
// ============================================================================

export interface GenerateMetaOptions {
  pageKey: string;
  customTitle?: string;
  customTitleAr?: string;
  customTitleEn?: string;
  customDesc?: string;
  customDescAr?: string;
  customDescEn?: string;
  customKeywords?: string[];
  customOgImage?: string;
  slug?: string;
  lang?: string;
}

export async function generatePageMeta(options: GenerateMetaOptions): Promise<SEOMeta> {
  const settings = await fetchSEOSettings();
  const config = PAGE_CONFIGS[options.pageKey] || PAGE_CONFIGS.home;
  
  const lang = options.lang || settings.defaultLang;
  const isAr = lang === "ar";
  
  // Determine title
  let title = options.customTitle || (isAr ? config.defaultTitleAr : config.defaultTitleEn);
  if (options.slug && config.hasDynamicContent) {
    title = `${title} | ${settings.siteNameAr}`;
  }
  
  // Determine description
  const description = options.customDesc || 
    (isAr 
      ? (options.customDescAr || config.defaultDescAr)
      : (options.customDescEn || config.defaultDescEn));

  // Determine keywords
  const keywords = options.customKeywords || 
    (isAr ? config.defaultKeywordsAr : config.defaultKeywordsEn);

  // Determine OG image
  const ogImage = options.customOgImage || settings.defaultOgImage;

  // Generate canonical URL
  let canonicalUrl = settings.baseUrl;
  if (options.slug) {
    canonicalUrl += `/${options.pageKey === "project" ? "project" : "page"}?slug=${options.slug}`;
  } else if (options.pageKey !== "home") {
    canonicalUrl += `/${options.pageKey}.html`;
  }

  // Generate structured data
  let structuredData: Record<string, unknown> | undefined;
  if (config.type === "website") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": isAr ? settings.siteNameAr : settings.siteNameEn,
      "url": settings.baseUrl,
      "description": description,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${settings.baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  } else if (config.type === "profile") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": isAr ? settings.siteNameAr : settings.siteNameEn,
      "url": settings.baseUrl,
      "jobTitle": "Web Developer",
      "description": description,
      "sameAs": []
    };
  }

  return {
    title,
    titleAr: options.customTitleAr || config.defaultTitleAr,
    titleEn: options.customTitleEn || config.defaultTitleEn,
    description,
    descriptionAr: options.customDescAr || config.defaultDescAr,
    descriptionEn: options.customDescEn || config.defaultDescEn,
    keywords,
    keywordsAr: config.defaultKeywordsAr,
    keywordsEn: config.defaultKeywordsEn,
    ogImage,
    ogImageSecure: ogImage,
    ogType: config.type,
    canonicalUrl,
    robots: "index, follow",
    structuredData,
  };
}

// ============================================================================
// HTML Meta Tags Injection
// ============================================================================

export function injectMetaTags(html: string, meta: SEOMeta, lang: string = "ar"): string {
  const isAr = lang === "ar";
  const siteName = isAr ? "فايز محمد | مطور ويب" : "Fayez Mohammed | Web Developer";
  const fullTitle = meta.title.includes(siteName.split(" | ")[0]) 
    ? meta.title 
    : `${meta.title} | ${siteName.split(" | ")[0]}`;

  const metaTags = `
  <!-- SEO Meta Tags - Generated Server-Side -->
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}" />
  <meta name="keywords" content="${escapeHtml(meta.keywords.join(", "))}" />
  <meta name="author" content="Fayez Mohammed" />
  <meta name="robots" content="${meta.robots}" />
  <link rel="canonical" href="${meta.canonicalUrl}" />
  
  <!-- Language Alternates -->
  <link rel="alternate" hreflang="ar" href="${meta.canonicalUrl}" />
  <link rel="alternate" hreflang="en" href="${meta.canonicalUrl.replace("?", (meta.canonicalUrl.includes("?") ? "&" : "?") + "lang=en")}" />
  <link rel="alternate" hreflang="x-default" href="${meta.canonicalUrl}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${meta.ogType}" />
  <meta property="og:url" content="${meta.canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:image" content="${meta.ogImage}" />
  <meta property="og:image:secure_url" content="${meta.ogImageSecure}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="${isAr ? "ar_AR" : "en_US"}" />
  <meta property="og:locale:alternate" content="${isAr ? "en_US" : "ar_AR"}" />
  <meta property="og:site_name" content="${siteName.split(" | ")[0]}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${meta.canonicalUrl}" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  <meta name="twitter:image" content="${meta.ogImage}" />
  <meta name="twitter:creator" content="@fayiz_dev" />
  
  <!-- Additional SEO -->
  <meta name="theme-color" content="#b8860b" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="format-detection" content="telephone=no" />
  
  ${meta.structuredData ? `<!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>` : ""}`;

  // Remove existing SEO meta tags to avoid duplicates
  let cleanHtml = html;
  
  // Remove existing title tags
  cleanHtml = cleanHtml.replace(/<title>[^<]*<\/title>/gi, "");
  
  // Remove existing meta description
  cleanHtml = cleanHtml.replace(/<meta[^>]*name=["']description["'][^>]*>/gi, "");
  
  // Remove existing meta keywords
  cleanHtml = cleanHtml.replace(/<meta[^>]*name=["']keywords["'][^>]*>/gi, "");
  
  // Remove existing robots meta
  cleanHtml = cleanHtml.replace(/<meta[^>]*name=["']robots["'][^>]*>/gi, "");
  
  // Remove existing canonical links
  cleanHtml = cleanHtml.replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi, "");
  
  // Remove existing hreflang links
  cleanHtml = cleanHtml.replace(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']*["'][^>]*>/gi, "");
  
  // Remove existing OG meta tags
  cleanHtml = cleanHtml.replace(/<meta[^>]*property=["']og:[^"']*["'][^>]*>/gi, "");
  
  // Remove existing Twitter meta tags
  cleanHtml = cleanHtml.replace(/<meta[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, "");
  
  // Remove existing JSON-LD scripts
  cleanHtml = cleanHtml.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[^<]*<\/script>/gi, "");

  // Insert meta tags after <head> tag
  const headStartIndex = cleanHtml.indexOf("<head");
  if (headStartIndex === -1) {
    return metaTags + cleanHtml;
  }
  
  const afterHeadTag = cleanHtml.indexOf(">", headStartIndex);
  if (afterHeadTag === -1) {
    return metaTags + cleanHtml;
  }
  
  return cleanHtml.slice(0, afterHeadTag + 1) + "\n  " + metaTags + "\n" + cleanHtml.slice(afterHeadTag + 1);
}

// ============================================================================
// Sitemap Generation
// ============================================================================

const SITEMAP_CACHE_KEY = "seo:sitemap";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  alternateLangs?: { lang: string; href: string }[];
}

export async function generateSitemap(): Promise<string> {
  const cached = getCache<string>(SITEMAP_CACHE_KEY);
  if (cached) return cached;

  const settings = await fetchSEOSettings();
  const baseUrl = settings.baseUrl;

  // Get all URLs
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: "/", priority: 1.0, changefreq: "weekly" as const },
    { path: "/about.html", priority: 0.8, changefreq: "monthly" as const },
    { path: "/services.html", priority: 0.9, changefreq: "weekly" as const },
    { path: "/portfolio.html", priority: 0.9, changefreq: "weekly" as const },
    { path: "/contact.html", priority: 0.7, changefreq: "yearly" as const },
  ];

  for (const page of staticPages) {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
      alternateLangs: [
        { lang: "ar", href: `${baseUrl}${page.path}` },
        { lang: "en", href: `${baseUrl}${page.path}?lang=en` },
      ],
    });
  }

  // Dynamic project pages
  try {
    const projects = await db.select({
      id: projectsTable.id,
      titleAr: projectsTable.titleAr,
      titleEn: projectsTable.titleEn,
      updatedAt: projectsTable.updatedAt,
    }).from(projectsTable);

    for (const project of projects) {
      const projectId = Number(project.id);
      urls.push({
        loc: `${baseUrl}/project.html?id=${projectId}`,
        lastmod: project.updatedAt ? new Date(project.updatedAt).toISOString().split("T")[0] : undefined,
        changefreq: "monthly",
        priority: 0.7,
        alternateLangs: [
          { lang: "ar", href: `${baseUrl}/project.html?id=${projectId}` },
          { lang: "en", href: `${baseUrl}/project.html?id=${projectId}&lang=en` },
        ],
      });
    }
  } catch {
    // If projects table query fails, continue without projects
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
    ${url.alternateLangs ? url.alternateLangs.map(alt => 
      `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.href}" />`
    ).join("\n") : ""}
  </url>`).join("\n")}
</urlset>`;

  setCache(SITEMAP_CACHE_KEY, sitemap);
  return sitemap;
}

// ============================================================================
// Robots.txt Generation
// ============================================================================

export function generateRobotsTxt(): string {
  const settings = {
    baseUrl: process.env.BASE_URL || "https://fayiz-mohammad.up.railway.app",
  };

  return `# Robots.txt for ${settings.baseUrl}
# Generated automatically for SEO optimization

User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /uploads/

# Disallow common non-content paths
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /_next/
Disallow: /~*

# Allow search engines to crawl sitemaps
Sitemap: ${settings.baseUrl}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Special instructions for major search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: YandexBot
Allow: /
Crawl-delay: 1`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}

// ============================================================================
// Cache Invalidation
// ============================================================================

export function invalidateSEOCache(): void {
  setCache(SEO_SETTINGS_CACHE_KEY, undefined);
  setCache(SITEMAP_CACHE_KEY, undefined);
}
