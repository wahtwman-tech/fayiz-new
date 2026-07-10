import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.username, username)).limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, username: user.username });
  res.json({ token, username: user.username });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as typeof req & { auth: { userId: number; username: string } }).auth;
  res.json({ userId: auth.userId, username: auth.username });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as typeof req & { auth: { userId: number; username: string } }).auth;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }

  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, auth.userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(adminUsersTable).set({ passwordHash: hash }).where(eq(adminUsersTable.id, auth.userId));
  res.json({ success: true });
});

export default router;
