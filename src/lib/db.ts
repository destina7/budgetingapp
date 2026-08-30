import { neon } from "@neondatabase/serverless";
import { AppState, DEFAULT_STATE, normalizeState } from "./types";

// Vercel's Neon/Postgres integration injects DATABASE_URL (or POSTGRES_URL)
// automatically once you attach a database to the project in the Vercel
// dashboard. We check both names to be safe.
function getConnectionString(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or POSTGRES_URL) " +
        "— in Vercel this happens automatically when you attach a Postgres database."
    );
  }
  return url;
}

let initialized = false;

async function ensureTable() {
  if (initialized) return;
  const sql = neon(getConnectionString());
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  initialized = true;
}

export async function getState(): Promise<AppState> {
  await ensureTable();
  const sql = neon(getConnectionString());
  const rows = await sql`SELECT data FROM app_state WHERE id = 1`;
  if (rows.length === 0) {
    await sql`INSERT INTO app_state (id, data) VALUES (1, ${JSON.stringify(DEFAULT_STATE)}::jsonb)`;
    return DEFAULT_STATE;
  }
  return normalizeState(rows[0].data);
}

export async function saveState(state: AppState): Promise<void> {
  await ensureTable();
  const sql = neon(getConnectionString());
  await sql`
    INSERT INTO app_state (id, data, updated_at)
    VALUES (1, ${JSON.stringify(state)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(state)}::jsonb, updated_at = now()
  `;
}
