import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/sections", async (req, res): Promise<void> => {
  const pageKey = req.query["pageKey"] as string | undefined;
  const query = db.select().from(sectionsTable);
  const sections = pageKey
    ? await db.select().from(sectionsTable).where(eq(sectionsTable.pageKey, pageKey)).orderBy(sectionsTable.sortOrder)
    : await query.orderBy(sectionsTable.sortOrder);
  res.json(sections);
});

router.put("/sections/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  const [section] = await db.update(sectionsTable).set(req.body).where(eq(sectionsTable.id, id)).returning();
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  res.json(section);
});

router.post("/sections", requireAuth, async (req, res): Promise<void> => {
  const { pageKey, sectionKey, contentAr, contentEn, sortOrder } = req.body as {
    pageKey?: string; sectionKey?: string; contentAr?: string; contentEn?: string; sortOrder?: number;
  };
  if (!pageKey || !sectionKey) {
    res.status(400).json({ error: "pageKey and sectionKey are required" });
    return;
  }
  const [section] = await db.insert(sectionsTable).values({
    pageKey,
    sectionKey,
    contentAr: contentAr || "",
    contentEn: contentEn || "",
    sortOrder: sortOrder ?? 0,
  }).returning();
  res.status(201).json(section);
});

export default router;
