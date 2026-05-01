import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { waitReportSourceEnum } from "./enums";

export const waitingRoomReportsTable = pgTable("WaitingRoomReport", {
  id: text("id").primaryKey(),
  peopleCount: integer("peopleCount").notNull(),
  source: waitReportSourceEnum("source").notNull(),
  visitReason: text("visitReason"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  clinicId: text("clinicId").notNull(),
  reportedByPhone: text("reportedByPhone"),
  reportedByUserId: text("reportedByUserId"),
}, (table) => [
  index().on(table.clinicId, table.createdAt),
  index().on(table.reportedByPhone, table.createdAt),
]);

export type WaitingRoomReport = typeof waitingRoomReportsTable.$inferSelect;
export type InsertWaitingRoomReport = typeof waitingRoomReportsTable.$inferInsert;
