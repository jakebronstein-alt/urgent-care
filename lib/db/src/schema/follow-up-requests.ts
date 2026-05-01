import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const followUpRequestsTable = pgTable("FollowUpRequest", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  visitReason: text("visitReason"),
  optedIn: boolean("optedIn").notNull().default(false),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  clinicId: text("clinicId").notNull(),
  reportId: text("reportId").notNull().unique(),
});

export type FollowUpRequest = typeof followUpRequestsTable.$inferSelect;
export type InsertFollowUpRequest = typeof followUpRequestsTable.$inferInsert;
