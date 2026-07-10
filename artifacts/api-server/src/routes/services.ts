import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.sortOrder);
  res.json(services);
});

router.post("/services", requireAuth, async (req, res): Promise<void> => {
  const [service] = await db.insert(servicesTable).values(req.body).returning();
  res.status(201).json(service);
});

router.put("/services/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  const [service] = await db.update(servicesTable).set(req.body).where(eq(servicesTable.id, id)).returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(service);
});

router.delete("/services/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.sendStatus(204);
});

export default router;
