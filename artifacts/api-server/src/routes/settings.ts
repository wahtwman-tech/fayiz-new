import { Router, type IRouter } from "express";
import multer from "multer";
import fs from "fs";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const uploadsDir = process.cwd() + "/public/uploads";
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, _file, cb) => cb(null, `logo-${Date.now()}.png`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    cb(null, allowed.includes(file.mimetype));
  },
});

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

// Upload logo as Base64
router.post("/settings/logo", requireAuth, upload.single("logo"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No logo file provided" });
    return;
  }

  const fileBuffer = fs.readFileSync(req.file.path);
  const base64Logo = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
  fs.unlinkSync(req.file.path);

  const key = "logo_image";
  const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettingsTable).set({ value: base64Logo }).where(eq(siteSettingsTable.key, key));
  } else {
    await db.insert(siteSettingsTable).values({ key, value: base64Logo });
  }

  res.json({ success: true, logo_image: base64Logo });
});

// Upload about cover image as Base64
router.post("/settings/about-cover", requireAuth, upload.single("image"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const fileBuffer = fs.readFileSync(req.file.path);
  const base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
  fs.unlinkSync(req.file.path);

  const key = "about_cover_image";
  const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettingsTable).set({ value: base64Image }).where(eq(siteSettingsTable.key, key));
  } else {
    await db.insert(siteSettingsTable).values({ key, value: base64Image });
  }

  res.json({ success: true, about_cover_image: base64Image });
});

export default router;
