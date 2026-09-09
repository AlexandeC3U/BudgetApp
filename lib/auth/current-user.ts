import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { getCurrentUser as getClerkAppUser } from "./server";

const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

let cachedDemoUser: User | null = null;

/**
 * Resolve the current user for API routes. Falls back to the seeded `demo-me`
 * row when Clerk isn't configured yet, so the UI keeps working end-to-end
 * during local development. Throws if neither path produces a user.
 */
export async function getRequestUser(): Promise<User> {
  if (HAS_CLERK_KEY) {
    const clerkUser = await getClerkAppUser();
    if (!clerkUser) {
      throw new ResponseError(401, "Unauthorized");
    }
    return clerkUser;
  }

  if (cachedDemoUser) return cachedDemoUser;
  const demo = await db.query.users.findFirst({
    where: eq(users.clerkUserId, "demo-me"),
  });
  if (!demo) {
    throw new ResponseError(
      500,
      "Demo user 'demo-me' not seeded — run `npm run db:seed`."
    );
  }
  cachedDemoUser = demo;
  return demo;
}

export class ResponseError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ResponseError";
  }
}
