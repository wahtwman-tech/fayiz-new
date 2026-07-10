import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";

const app: Express = express();

const publicDir = path.join(process.cwd(), "public");

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

// Serve uploaded files and static assets
app.use(express.static(publicDir));

// API routes
app.use("/api", router);

// Seed DB on startup
seedIfEmpty().catch((err: unknown) => logger.error({ err }, "Seed failed"));

export default app;
