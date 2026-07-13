import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";
import { renderPage, fetchSSRData, injectSSRData } from "./lib/ssr";
import { generatePageMeta, injectMetaTags, generateRobotsTxt, generateSitemap } from "./lib/seo";
import { ipBlockerMiddleware } from "./middlewares/ipBlocker";

const app: Express = express();
const publicDir = path.join(process.cwd(), "public");

// Security middleware - Helmet with strict CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'none'"],
        childSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

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

    // Inject data into HTML
    html = injectSSRData(html, data);

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
