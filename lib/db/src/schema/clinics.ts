import { pgTable, text, boolean, doublePrecision, timestamp, json } from "drizzle-orm/pg-core";
import { clinicCapacityEnum } from "./enums";

export const clinicsTable = pgTable("Clinic", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("streetAddress").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  stateSlug: text("stateSlug").notNull(),
  citySlug: text("citySlug").notNull(),
  addressSlug: text("addressSlug").notNull(),
  clinicSlug: text("clinicSlug").notNull(),
  phone: text("phone"),
  website: text("website"),
  zocdocUrl: text("zocdocUrl"),
  hours: json("hours"),
  capacity: clinicCapacityEnum("capacity").notNull().default("MEDIUM"),
  googlePlaceId: text("googlePlaceId").unique(),
  isClaimed: boolean("isClaimed").notNull().default(false),
  claimedById: text("claimedById"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type Clinic = typeof clinicsTable.$inferSelect;
export type InsertClinic = typeof clinicsTable.$inferInsert;
