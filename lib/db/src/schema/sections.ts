import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sectionsTable = pgTable("sections", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull(),
  sectionKey: text("section_key").notNull(),
  contentAr: text("content_ar").notNull().default(""),
  contentEn: text("content_en").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSectionSchema = createInsertSchema(sectionsTable).omit({ id: true, updatedAt: true });
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sectionsTable.$inferSelect;
