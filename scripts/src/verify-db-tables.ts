import { db, sql } from "@workspace/db";
import {
  clinicsTable,
  usersTable,
  reviewsTable,
  waitingRoomReportsTable,
  followUpRequestsTable,
} from "@workspace/db";

const EXPECTED_TABLES: Record<string, string> = {
  Clinic: "clinicsTable",
  User: "usersTable",
  Review: "reviewsTable",
  WaitingRoomReport: "waitingRoomReportsTable",
  FollowUpRequest: "followUpRequestsTable",
};

async function verifyDbTables(): Promise<void> {
  console.log("=== DB Table Name Verification ===\n");

  const rows = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  const liveTableNames = new Set(rows.rows.map((r) => r.tablename));

  console.log("Live DB tables:");
  for (const name of [...liveTableNames].sort()) {
    console.log(`  - ${name}`);
  }
  console.log();

  let allPassed = true;

  console.log("Checking Drizzle schema table names against live DB:");
  for (const [expectedName, schemaVar] of Object.entries(EXPECTED_TABLES)) {
    const exists = liveTableNames.has(expectedName);
    const status = exists ? "PASS" : "FAIL";
    console.log(`  [${status}] "${expectedName}" (${schemaVar})`);
    if (!exists) allPassed = false;
  }
  console.log();

  console.log("SELECT LIMIT 1 smoke test per required table:");

  const tableQueries: Array<{ label: string; query: () => Promise<unknown> }> = [
    {
      label: "Clinic",
      query: () =>
        db
          .select({
            id: clinicsTable.id,
            name: clinicsTable.name,
          })
          .from(clinicsTable)
          .limit(1),
    },
    {
      label: "User",
      query: () =>
        db
          .select({ id: usersTable.id, email: usersTable.email })
          .from(usersTable)
          .limit(1),
    },
    {
      label: "Review",
      query: () =>
        db
          .select({ id: reviewsTable.id })
          .from(reviewsTable)
          .limit(1),
    },
    {
      label: "WaitingRoomReport",
      query: () =>
        db
          .select({ id: waitingRoomReportsTable.id })
          .from(waitingRoomReportsTable)
          .limit(1),
    },
    {
      label: "FollowUpRequest",
      query: () =>
        db
          .select({ id: followUpRequestsTable.id })
          .from(followUpRequestsTable)
          .limit(1),
    },
  ];

  for (const { label, query } of tableQueries) {
    try {
      const result = (await query()) as unknown[];
      const rowCount = result.length;
      console.log(`  [PASS] ${label} — query succeeded (${rowCount} row(s) returned)`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  [FAIL] ${label} — query failed: ${message}`);
      allPassed = false;
    }
  }

  console.log();
  if (allPassed) {
    console.log("All checks passed. Drizzle table names match the live database.");
    process.exit(0);
  } else {
    console.error("One or more checks FAILED. See above for details.");
    process.exit(1);
  }
}

verifyDbTables().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
