// NOTE: server-only at runtime — never import this module from a Client Component.
// We deliberately omit `import "server-only"` so the same module can run inside
// dev scripts (e.g. tsx scripts/seed.ts) which don't expose the react-server
// export condition. Server-side route handlers and server actions are the only
// callers in app code.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (Supabase → Project Settings → Database → Connection string)."
  );
}

// Reuse the connection across HMR reloads in dev to avoid leaking sockets.
const globalForDb = globalThis as unknown as {
  __pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pg ??
  postgres(connectionString, {
    // Required for Supabase's transaction pooler (port 6543).
    // No-op for direct connection (port 5432).
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pg = client;

export const db = drizzle(client, { schema });
export { schema };
