import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  res.json(map);
});

router.put("/settings", requireAuth, async (req, res): Promise<void> => {
  const updates = req.body as Record<string, string>;
  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Invalid settings payload" });
    return;
  }

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== "string") continue;
    const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettingsTable).set({ value }).where(eq(siteSettingsTable.key, key));
    } else {
      await db.insert(siteSettingsTable).values({ key, value });
    }
  }

  res.json({ success: true });
});

export default router;
