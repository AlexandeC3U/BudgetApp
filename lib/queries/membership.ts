import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tabMembers } from "@/lib/db/schema";

/**
 * Subquery of the tab ids a user belongs to. Embed it directly in
 * `inArray(column, userTabIds(userId))` to scope a query to the caller's tabs
 * in a single SQL statement — avoids the extra round-trip of fetching the id
 * list first and then issuing the real query. Build a fresh one per query
 * rather than reusing the instance.
 */
export function userTabIds(userId: string) {
  return db
    .select({ tabId: tabMembers.tabId })
    .from(tabMembers)
    .where(eq(tabMembers.userId, userId));
}
