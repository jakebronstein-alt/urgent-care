import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums";

export const usersTable = pgTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  name: text("name"),
  image: text("image"),
  hashedPassword: text("hashedPassword"),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
