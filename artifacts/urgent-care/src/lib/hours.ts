export type DaySchedule = { open: string; close: string } | null;

export interface ClinicHours {
  sun: DaySchedule;
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
}

const DAY_KEYS: (keyof ClinicHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const DAY_LABELS: Record<keyof ClinicHours, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

/** Parse "HH:MM" into a Date on the same calendar day as baseDate */
function parseTime(timeStr: string, baseDate: Date): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Format "HH:MM" → "8am" / "12pm" / "5:30pm" */
export function formatHourMin(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
}

export function isClinicOpen(hours: ClinicHours, now = new Date()): boolean {
  const dayKey = DAY_KEYS[now.getDay()];
  const schedule = hours[dayKey];
  if (!schedule) return false;
  const openTime = parseTime(schedule.open, now);
  const closeTime = parseTime(schedule.close, now);
  return now >= openTime && now < closeTime;
}

/**
 * Returns a human-readable label for when the clinic next opens,
 * e.g. "Opens today at 8am", "Opens tomorrow at 9am", "Opens Saturday at 9am".
 * Returns null if no future open time found within the next 7 days.
 */
export function nextOpenLabel(hours: ClinicHours, now = new Date()): string | null {
  for (let i = 0; i <= 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    const dayKey = DAY_KEYS[checkDate.getDay()];
    const schedule = hours[dayKey];
    if (!schedule) continue;

    const openTime = parseTime(schedule.open, checkDate);

    if (i === 0) {
      // Same day — only relevant if opening is still in the future
      if (openTime > now) return `Opens today at ${formatHourMin(schedule.open)}`;
      // Already past open time → check if still within close window (handled by isClinicOpen)
      continue;
    }
    if (i === 1) return `Opens tomorrow at ${formatHourMin(schedule.open)}`;
    return `Opens ${DAY_LABELS[dayKey]} at ${formatHourMin(schedule.open)}`;
  }
  return null;
}

/** Safely cast unknown JSON from Prisma to ClinicHours (returns null if invalid) */
export function parseHours(json: unknown): ClinicHours | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  return json as ClinicHours;
}
