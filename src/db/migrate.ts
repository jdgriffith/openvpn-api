import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../utils/env";

// Migrates the database to the latest schema
async function main() {
  const connectionString = env.DATABASE_URL;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("⏳ Running migrations...");

  // This will automatically create the database tables based on our schema
  const start = Date.now();
  await migrate(db, { migrationsFolder: "drizzle" });

  console.log(`✅ Migrations completed in ${Date.now() - start}ms`);

  await sql.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Migration failed:");
  console.error(e);
  process.exit(1);
});
