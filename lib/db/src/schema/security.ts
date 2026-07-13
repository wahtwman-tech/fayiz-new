import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ipBansTable = pgTable("ip_bans", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  failedAttempts: integer("failed_attempts").notNull().default(1),
  bannedUntil: timestamp("banned_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginAttemptsTable = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  username: text("username").notNull(),
  success: integer("success").notNull().default(0),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIpBanSchema = createInsertSchema(ipBansTable).omit({ id: true, createdAt: true });
export type InsertIpBan = z.infer<typeof insertIpBanSchema>;
export type IpBan = typeof ipBansTable.$inferSelect;

export const insertLoginAttemptSchema = createInsertSchema(loginAttemptsTable).omit({ id: true, attemptedAt: true });
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttemptsTable.$inferSelect;
