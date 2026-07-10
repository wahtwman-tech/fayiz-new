import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const navItemsTable = pgTable("nav_items", {
  id: serial("id").primaryKey(),
  labelAr: text("label_ar").notNull().default(""),
  labelEn: text("label_en").notNull().default(""),
  url: text("url").notNull().default("/"),
  target: text("target").notNull().default("_self"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNavItemSchema = createInsertSchema(navItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNavItem = z.infer<typeof insertNavItemSchema>;
export type NavItem = typeof navItemsTable.$inferSelect;
