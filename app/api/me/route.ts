import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { userToDto } from "@/lib/queries/me";
import { MeResponseSchema, UpdateUserInputSchema } from "@/lib/schemas/user";

export async function GET() {
  try {
    const user = await getRequestUser();
    return NextResponse.json(
      MeResponseSchema.parse({ user: userToDto(user) })
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequestUser();
    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = UpdateUserInputSchema.parse(json);

    const patch: Partial<typeof users.$inferInsert> = {};
    if (input.name !== undefined) {
      patch.name = input.name;
      // Keep initials in sync with the name automatically.
      patch.initials = deriveInitials(input.name);
    }
    if (input.color !== undefined) patch.avatarColor = input.color.toUpperCase();

    const [row] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json(MeResponseSchema.parse({ user: userToDto(row) }));
  } catch (err) {
    return errorResponse(err);
  }
}

/** First letter of the first two words, uppercased (max 2 chars). */
function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]);
  const initials = letters.join("").toUpperCase();
  return initials.slice(0, 4) || "·";
}

function errorResponse(err: unknown) {
  if (err instanceof ResponseError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid input", issues: err.flatten() },
      { status: 400 }
    );
  }
  throw err;
}
