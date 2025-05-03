import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../utils/env";

// Create a PostgreSQL connection
const connectionString = env.DATABASE_URL;
const client = postgres(connectionString);

// Create a Drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export { schema };
