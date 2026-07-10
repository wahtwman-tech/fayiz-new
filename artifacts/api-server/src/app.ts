import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";
import { renderPage, fetchSSRData, injectSSRData } from "./lib/ssr";

const app: Express = express();
const publicDir = path.join(process.cwd(), "public");

// Pages that need SSR (will have data injected)
const srrPages = [
  "index.html",
  "about.html",
  "contact.html",
  "portfolio.html",
  "services.html",
  "page.html",
  "project.html",
];

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

// API routes
app.use("/api", router);

// Seed DB on startup
seedIfEmpty().catch((err: unknown) => logger.error({ err }, "Seed failed"));

// SSR for public pages
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
  if (!srrPages.includes(pageName)) {
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

    // Send the modified HTML
    res.type("html").send(html);
  } catch (err) {
    logger.error({ err }, "SSR error");
    next(err);
  }
});

// Serve static files for admin (no SSR needed)
app.use("/admin", express.static(path.join(publicDir, "admin")));

// Serve remaining static files
app.use(express.static(publicDir));

export default app;
