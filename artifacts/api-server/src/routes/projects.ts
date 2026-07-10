import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { projectsTable, projectImagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.get("/projects", async (req, res): Promise<void> => {
  const featuredOnly = req.query["featured"] === "true";
  let projects;
  if (featuredOnly) {
    projects = await db.select().from(projectsTable)
      .where(eq(projectsTable.isFeatured, true))
      .orderBy(projectsTable.sortOrder);
  } else {
    projects = await db.select().from(projectsTable).orderBy(projectsTable.sortOrder);
  }

  const result = await Promise.all(projects.map(async (p) => {
    const images = await db.select().from(projectImagesTable).where(eq(projectImagesTable.projectId, p.id)).orderBy(projectImagesTable.sortOrder);
    return { ...p, images };
  }));

  res.json(result);
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const images = await db.select().from(projectImagesTable).where(eq(projectImagesTable.projectId, id)).orderBy(projectImagesTable.sortOrder);
  res.json({ ...project, images });
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const data = req.body as Record<string, unknown>;
  // Technologies can come as JSON string
  if (typeof data["technologies"] === "string") {
    try { data["technologies"] = JSON.parse(data["technologies"] as string); } catch { data["technologies"] = []; }
  }
  const [project] = await db.insert(projectsTable).values(data as Parameters<typeof db.insert>[0] extends infer T ? T : never).returning();
  res.status(201).json(project);
});

router.put("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  const data = req.body as Record<string, unknown>;
  if (typeof data["technologies"] === "string") {
    try { data["technologies"] = JSON.parse(data["technologies"] as string); } catch { data["technologies"] = []; }
  }
  const [project] = await db.update(projectsTable).set(data).where(eq(projectsTable.id, id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw, 10);
  // Images cascade-delete via FK
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.sendStatus(204);
});

router.post("/projects/:id/images", requireAuth, upload.single("image"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const projectId = parseInt(raw, 10);

  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const isPrimary = req.body["isPrimary"] === "true";
  if (isPrimary) {
    await db.update(projectImagesTable).set({ isPrimary: false }).where(eq(projectImagesTable.projectId, projectId));
  }

  const [image] = await db.insert(projectImagesTable).values({
    projectId,
    filename: req.file.filename,
    altAr: req.body["altAr"] || "",
    altEn: req.body["altEn"] || "",
    isPrimary,
    sortOrder: 0,
  }).returning();

  res.status(201).json({ ...image, url: `/uploads/${req.file.filename}` });
});

router.delete("/projects/:projectId/images/:imageId", requireAuth, async (req, res): Promise<void> => {
  const rawImg = Array.isArray(req.params["imageId"]) ? req.params["imageId"][0] : req.params["imageId"];
  const imageId = parseInt(rawImg, 10);

  const [image] = await db.select().from(projectImagesTable).where(eq(projectImagesTable.id, imageId)).limit(1);
  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  // Delete file
  const filePath = path.join(uploadsDir, image.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await db.delete(projectImagesTable).where(eq(projectImagesTable.id, imageId));
  res.sendStatus(204);
});

export default router;
