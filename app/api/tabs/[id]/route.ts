import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { tabMembers, tabs } from "@/lib/db/schema";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getTabForUser } from "@/lib/queries/tabs";
import {
  TabDtoSchema,
  TabResponseSchema,
  UpdateTabInputSchema,
} from "@/lib/schemas/tab";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;
    const tab = await getTabForUser(id, user.id);
    if (!tab) throw new ResponseError(404, "Tab not found");
    return NextResponse.json({ tab: TabDtoSchema.parse(tab) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;
    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = UpdateTabInputSchema.parse(json);

    // Any member may edit the tab's metadata.
    await requireMembership(id, user.id);

    const patch: Partial<typeof tabs.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.emoji !== undefined) patch.emoji = input.emoji;
    if (input.color !== undefined) patch.color = input.color.toUpperCase();
    if (input.budget !== undefined) patch.budget = input.budget.toFixed(2);
    if (input.currency !== undefined) patch.currency = input.currency;

    await db.update(tabs).set(patch).where(eq(tabs.id, id));

    const tab = await getTabForUser(id, user.id);
    if (!tab) throw new ResponseError(404, "Tab not found");
    return NextResponse.json(TabResponseSchema.parse({ tab }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;

    // Only the owner can delete a tab. Cascades clear members, transactions,
    // and splits via the schema's onDelete rules.
    const membership = await requireMembership(id, user.id);
    if (membership.role !== "owner") {
      throw new ResponseError(403, "Only the tab owner can delete it");
    }

    await db.delete(tabs).where(eq(tabs.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

async function requireMembership(tabId: string, userId: string) {
  const membership = await db.query.tabMembers.findFirst({
    where: and(eq(tabMembers.tabId, tabId), eq(tabMembers.userId, userId)),
  });
  if (!membership) throw new ResponseError(403, "Forbidden");
  return membership;
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
