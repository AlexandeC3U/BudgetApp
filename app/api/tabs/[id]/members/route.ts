import { NextResponse, type NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { tabMembers, users } from "@/lib/db/schema";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getTabForUser } from "@/lib/queries/tabs";
import { AddMemberInputSchema, TabResponseSchema } from "@/lib/schemas/tab";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id: tabId } = await params;
    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = AddMemberInputSchema.parse(json);

    // Caller must already belong to the tab to invite others.
    const callerMembership = await db.query.tabMembers.findFirst({
      where: and(
        eq(tabMembers.tabId, tabId),
        eq(tabMembers.userId, user.id)
      ),
    });
    if (!callerMembership) throw new ResponseError(403, "Forbidden");

    // Resolve the invitee by email (case-insensitive).
    const invitee = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${input.email.toLowerCase()}`,
    });
    if (!invitee) {
      throw new ResponseError(404, "No account found with that email");
    }

    const already = await db.query.tabMembers.findFirst({
      where: and(
        eq(tabMembers.tabId, tabId),
        eq(tabMembers.userId, invitee.id)
      ),
    });
    if (already) {
      throw new ResponseError(409, "That person is already in this tab");
    }

    await db
      .insert(tabMembers)
      .values({ tabId, userId: invitee.id, role: "member" });

    const tab = await getTabForUser(tabId, user.id);
    if (!tab) throw new ResponseError(404, "Tab not found");
    return NextResponse.json(TabResponseSchema.parse({ tab }), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
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
