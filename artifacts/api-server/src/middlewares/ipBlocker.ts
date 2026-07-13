import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { ipBansTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const MAX_FAILED_ATTEMPTS = 5;
const BAN_DURATION_HOURS = 1;

export function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export async function isIPBanned(ip: string): Promise<boolean> {
  const [ban] = await db
    .select()
    .from(ipBansTable)
    .where(
      and(
        eq(ipBansTable.ipAddress, ip),
        gt(ipBansTable.bannedUntil, new Date())
      )
    )
    .limit(1);

  return !!ban;
}

export async function recordFailedLogin(ip: string, username: string): Promise<void> {
  // Check if already banned
  if (await isIPBanned(ip)) {
    return;
  }

  // Find existing record
  const [existingBan] = await db
    .select()
    .from(ipBansTable)
    .where(eq(ipBansTable.ipAddress, ip))
    .limit(1);

  if (existingBan) {
    const newAttempts = existingBan.failedAttempts + 1;
    
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Ban the IP
      const bannedUntil = new Date(Date.now() + BAN_DURATION_HOURS * 60 * 60 * 1000);
      await db
        .update(ipBansTable)
        .set({ 
          failedAttempts: newAttempts, 
          bannedUntil 
        })
        .where(eq(ipBansTable.id, existingBan.id));
    } else {
      await db
        .update(ipBansTable)
        .set({ failedAttempts: newAttempts })
        .where(eq(ipBansTable.id, existingBan.id));
    }
  } else {
    // Create new record
    await db.insert(ipBansTable).values({
      ipAddress: ip,
      failedAttempts: 1,
    });
  }
}

export async function clearFailedAttempts(ip: string): Promise<void> {
  await db
    .delete(ipBansTable)
    .where(eq(ipBansTable.ipAddress, ip));
}

export function ipBlockerMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIP(req);
    
    if (await isIPBanned(ip)) {
      res.status(403).json({ 
        error: "تم حظر عنوان IP الخاص بك مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة. يرجى المحاولة لاحقاً.",
        blocked: true,
        retryAfter: "1 hour"
      });
      return;
    }
    
    next();
  };
}
