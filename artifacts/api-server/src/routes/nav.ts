import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { navItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/nav", async (_req, res): Promise<void> => {
  const items = await db.select().from(navItemsTable).orderBy(navItemsTable.sortOrder);
  res.json(items);
});

router.post("/nav", requireAuth, async (req, res): Promise<void> => {
  const [item] = await db.insert(navItemsTable).values(req.body).returning();
  res.status(201).json(item);
});

router.put("/nav/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  const [item] = await db.update(navItemsTable).set(req.body).where(eq(navItemsTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Nav item not found" });
    return;
  }
  res.json(item);
});

router.delete("/nav/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  await db.delete(navItemsTable).where(eq(navItemsTable.id, id));
  res.sendStatus(204);
});

export default router;
