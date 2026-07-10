import app from "./app";
import { logger } from "./lib/logger";
import { migrate } from "./lib/migrate";
import { seedIfEmpty } from "./lib/seed";

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
    
    // Start the server
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

start();
