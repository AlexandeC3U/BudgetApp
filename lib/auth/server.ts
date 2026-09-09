import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

/**
 * Return the application user for the currently signed-in Clerk session,
 * creating the row on first sign-in. Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (existing) return existing;

  // First sign-in: pull profile from Clerk.
  const cu = await currentUser();
  const email =
    cu?.emailAddresses[0]?.emailAddress ?? `${clerkUserId}@unknown.local`;
  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];
  const initials =
    name
      .split(/\s+/)
      .map((w: string) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // A row may already exist for this (Clerk-verified) email — e.g. the Clerk
  // account was deleted and recreated, giving a new clerkUserId. Re-link that
  // row to the new id instead of inserting a duplicate (email is unique).
  const byEmail = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (byEmail) {
    // If the existing name is still the email-prefix placeholder, upgrade it
    // from Clerk; otherwise preserve any in-app profile edits.
    const isPlaceholderName = byEmail.name === byEmail.email.split("@")[0];
    const [relinked] = await db
      .update(users)
      .set(isPlaceholderName ? { clerkUserId, name, initials } : { clerkUserId })
      .where(eq(users.id, byEmail.id))
      .returning();
    return relinked;
  }

  const [created] = await db
    .insert(users)
    .values({ clerkUserId, email, name, initials })
    .returning();

  return created;
}
