import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";
import { renderPage, fetchSSRData, injectSSRData } from "./lib/ssr";
import { generatePageMeta, injectMetaTags, generateRobotsTxt, generateSitemap } from "./lib/seo";
import { ipBlockerMiddleware } from "./middlewares/ipBlocker";

const app: Express = express();
const publicDir = path.join(process.cwd(), "public");

// Generate a new nonce for each request
const generateNonce = (): string => {
  return crypto.randomBytes(16).toString("base64");
};

// Security middleware - Helmet with strict CSP + Nonces
app.use((req: Request, res: Response, next: NextFunction) => {
  const nonce = generateNonce();
  
  // Store nonce for use in templates
  res.locals.nonce = nonce;
  
  // Set CSP header with nonce + unsafe-inline
  // Note: unsafe-inline مطلوب لأن الموقع يستخدم event handlers inline
  // لكن nonce يضيف طبقة أمان إضافية للسكربتات التي نحقنها
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Scripts - nonce للسكربتات التي نحقنها + unsafe-inline للevent handlers
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
      // Styles - بالسماح بـ Google Fonts + unsafe-inline
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts - Google Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images
      "img-src 'self' data: blob: https: http:",
      // API connections
      "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
      // Media
      "media-src 'self' blob:",
      // Objects
      "object-src 'none'",
      // Base
      "base-uri 'self'",
      // Forms
      "form-action 'self'",
      // Frames
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "child-src 'none'",
      // Workers
      "worker-src 'self' blob:",
      // Manifest
      "manifest-src 'self'",
      // Upgrade insecure
      "upgrade-insecure-requests",
    ].join("; ")
  );
  
  next();
});

// Set Permissions-Policy header manually (تعطيل الكاميرا والميكروفون والموقع)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  next();
});

// Hide server technology headers
app.disable("x-powered-by");
app.disable("etag");

// Apply IP blocker to auth routes
app.use("/api/auth/login", ipBlockerMiddleware());

// Pages that need SSR (will have data injected)
const ssrPages = [
  "index.html",
  "about.html",
  "contact.html",
  "portfolio.html",
  "services.html",
  "page.html",
  "project.html",
];

// Page key mapping
const pageKeyMapping: Record<string, string> = {
  "index.html": "home",
  "about.html": "about",
  "contact.html": "contact",
  "portfolio.html": "portfolio",
  "services.html": "services",
  "page.html": "page",
  "project.html": "project",
};

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files and static assets (CSS, JS, images)
app.use("/css", express.static(path.join(publicDir, "css")));
app.use("/js", express.static(path.join(publicDir, "js")));
app.use("/uploads", express.static(path.join(publicDir, "uploads")));

// SEO Routes (before API routes)
app.get("/robots.txt", (_req: Request, res: Response) => {
  const robotsTxt = generateRobotsTxt();
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(robotsTxt);
});

app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const sitemap = await generateSitemap();
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=1800");
    res.send(sitemap);
  } catch (err) {
    logger.error({ err }, "Sitemap error");
    res.status(500).send("Error generating sitemap");
  }
});

// API routes
app.use("/api", router);

// Seed DB on startup
seedIfEmpty().catch((err: unknown) => logger.error({ err }, "Seed failed"));

// SSR for public pages with dynamic meta tags
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Skip non-HTML requests
  if (!req.path.endsWith(".html") && req.path !== "/") {
    return next();
  }

  // Determine which page to render
  let filename = req.path;
  if (filename === "/") {
    filename = "/index.html";
  }

  // Check if this page needs SSR
  const pageName = filename.slice(1); // Remove leading /
  if (!ssrPages.includes(pageName)) {
    return next();
  }

  try {
    // Read HTML file
    const filePath = path.join(publicDir, pageName);
    if (!fs.existsSync(filePath)) {
      return next();
    }

    let html = fs.readFileSync(filePath, "utf-8");

    // Fetch SSR data
    const data = await fetchSSRData();

    // Inject data into HTML with nonce
    const nonce = res.locals.nonce as string | undefined;
    html = injectSSRData(html, data, nonce);

    // Generate and inject SEO meta tags
    const pageKey = pageKeyMapping[pageName] || "home";
    const lang = req.query.lang as string || "ar";
    
    // Get project-specific data if applicable
    let metaOptions: Parameters<typeof generatePageMeta>[0] = {
      pageKey,
      lang,
    };

    // For project pages, get dynamic data
    if (pageName === "project.html" && req.query.id) {
      // Will be populated from SSR data in a real implementation
      metaOptions.customTitleAr = `مشروع رقم ${req.query.id}`;
      metaOptions.customTitleEn = `Project #${req.query.id}`;
    }

    const meta = await generatePageMeta(metaOptions);
    html = injectMetaTags(html, meta, lang);

    // Send the modified HTML
    res.type("html").send(html);
  } catch (err) {
    logger.error({ err }, "SSR error");
    next(err);
  }
});

// Serve static files for admin panel with hidden path
// Changed from /admin to /fayiz-editor to prevent path discovery
app.use("/fayiz-editor", express.static(path.join(publicDir, "admin"), {
  setHeaders: (res) => {
    // Add noindex, nofollow for all admin pages
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    // Prevent caching of admin pages
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
}));

// Serve remaining static files
app.use(express.static(publicDir));

export default app;
