import app from "./app";
import { logger } from "./lib/logger";
import { migrate } from "./lib/migrate";
import { seedIfEmpty } from "./lib/seed";
import { prewarmISRCache, isISRReady } from "./lib/ssr";

const rawPort = process.env["PORT"] || "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn(`Invalid PORT value: "${rawPort}", using default 8080`);
}

async function start(): Promise<void> {
  try {
    // Run migrations first
    await migrate();
    
    // Then seed default data
    await seedIfEmpty();
    
    // Pre-warm ISR cache (fetch all data and build HTML once)
    // This ensures visitors get cached content immediately
    await prewarmISRCache();
    
    // Start the server
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ 
        port, 
        isrReady: isISRReady(),
        strategy: "On-Demand ISR (Cache-Forever)" 
      }, "Server listening");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

start();
