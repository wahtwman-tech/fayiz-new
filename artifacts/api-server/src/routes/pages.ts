import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pagesTable, navItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/pages", async (_req, res): Promise<void> => {
  const pages = await db.select().from(pagesTable).orderBy(pagesTable.sortOrder);
  res.json(pages);
});

router.get("/pages/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params["slug"]) ? req.params["slug"][0] : req.params["slug"];
  const [page] = await db.select().from(pagesTable).where(eq(pagesTable.slug, slug)).limit(1);
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json(page);
});

router.post("/pages", requireAuth, async (req, res): Promise<void> => {
  const { slug, titleAr, titleEn, contentAr, contentEn, isPublished, sortOrder } = req.body as {
    slug?: string; titleAr?: string; titleEn?: string;
    contentAr?: string; contentEn?: string; isPublished?: boolean; sortOrder?: number;
  };

  if (!slug || !titleAr) {
    res.status(400).json({ error: "Slug and Arabic title are required" });
    return;
  }

  const [page] = await db.insert(pagesTable).values({
    slug,
    titleAr: titleAr || "",
    titleEn: titleEn || "",
    contentAr: contentAr || "",
    contentEn: contentEn || "",
    isPublished: isPublished ?? false,
    sortOrder: sortOrder ?? 0,
    isSystem: false,
  }).returning();

  // Auto-add to nav if requested
  if (req.body.addToNav && page) {
    await db.insert(navItemsTable).values({
      labelAr: titleAr,
      labelEn: titleEn || titleAr,
      url: `/page.html?slug=${slug}`,
      sortOrder: 99,
    });
  }

  res.status(201).json(page);
});

router.put("/pages/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);

  const [page] = await db.update(pagesTable).set(req.body).where(eq(pagesTable.id, id)).returning();
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json(page);
});

router.delete("/pages/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);

  const [page] = await db.select().from(pagesTable).where(eq(pagesTable.id, id)).limit(1);
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  if (page.isSystem) {
    res.status(403).json({ error: "Cannot delete system pages" });
    return;
  }

  await db.delete(pagesTable).where(eq(pagesTable.id, id));
  res.sendStatus(204);
});

export default router;
