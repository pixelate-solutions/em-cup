import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and add your Neon connection string.");
}

const client = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

export const db = drizzle(client, { schema });
