import { pgTable, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const reviewsTable = pgTable("Review", {
  id: text("id").primaryKey(),
  rating: integer("rating").notNull(),
  body: text("body"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  clinicId: text("clinicId").notNull(),
  userId: text("userId").notNull(),
}, (table) => [
  unique().on(table.clinicId, table.userId),
]);

export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;
