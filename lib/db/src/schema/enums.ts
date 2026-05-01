import { pgEnum } from "drizzle-orm/pg-core";

export const waitReportSourceEnum = pgEnum("WaitReportSource", [
  "SMS",
  "CLINIC_DASHBOARD",
  "CROWDSOURCED_WEB",
]);

export const roleEnum = pgEnum("Role", ["USER", "CLINIC_OWNER", "ADMIN"]);

export const clinicCapacityEnum = pgEnum("ClinicCapacity", [
  "SMALL",
  "MEDIUM",
  "LARGE",
]);
