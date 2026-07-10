import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pagesTable = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titleAr: text("title_ar").notNull().default(""),
  titleEn: text("title_en").notNull().default(""),
  contentAr: text("content_ar").notNull().default(""),
  contentEn: text("content_en").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPageSchema = createInsertSchema(pagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pagesTable.$inferSelect;
