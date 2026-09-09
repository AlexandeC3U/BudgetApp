import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { tabMembers, tabs } from "@/lib/db/schema";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getTabForUser, getTabsForUser } from "@/lib/queries/tabs";
import {
  CreateTabInputSchema,
  TabResponseSchema,
  TabsResponseSchema,
} from "@/lib/schemas/tab";

export async function GET() {
  try {
    const user = await getRequestUser();
    const list = await getTabsForUser(user.id);
    return NextResponse.json(TabsResponseSchema.parse({ tabs: list }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser();
    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = CreateTabInputSchema.parse(json);

    // Create the tab and enroll the creator as its owner in one transaction.
    const createdId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(tabs)
        .values({
          name: input.name,
          emoji: input.emoji,
          color: input.color.toUpperCase(),
          budget: input.budget.toFixed(2),
          currency: input.currency,
          createdBy: user.id,
        })
        .returning({ id: tabs.id });

      await tx.insert(tabMembers).values({
        tabId: row.id,
        userId: user.id,
        role: "owner",
      });
      return row.id;
    });

    const tab = await getTabForUser(createdId, user.id);
    if (!tab) throw new ResponseError(500, "Newly created tab missing");
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
