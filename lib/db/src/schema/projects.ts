import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull().default(""),
  titleEn: text("title_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  problemAr: text("problem_ar").notNull().default(""),
  problemEn: text("problem_en").notNull().default(""),
  solutionAr: text("solution_ar").notNull().default(""),
  solutionEn: text("solution_en").notNull().default(""),
  category: text("category").notNull().default(""),
  technologies: text("technologies").array().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  liveUrl: text("live_url").notNull().default(""),
  githubUrl: text("github_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const projectImagesTable = pgTable("project_images", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  altAr: text("alt_ar").notNull().default(""),
  altEn: text("alt_en").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectImageSchema = createInsertSchema(projectImagesTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectImage = z.infer<typeof insertProjectImageSchema>;
export type Project = typeof projectsTable.$inferSelect;
export type ProjectImage = typeof projectImagesTable.$inferSelect;
