import { NextResponse, type NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { tabMembers, transactionSplits, transactions } from "@/lib/db/schema";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getTabForUser } from "@/lib/queries/tabs";
import { TabResponseSchema } from "@/lib/schemas/tab";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id: tabId, userId: targetId } = await params;

    // Only the owner can remove members.
    const callerMembership = await db.query.tabMembers.findFirst({
      where: and(
        eq(tabMembers.tabId, tabId),
        eq(tabMembers.userId, user.id)
      ),
    });
    if (!callerMembership) throw new ResponseError(403, "Forbidden");
    if (callerMembership.role !== "owner") {
      throw new ResponseError(403, "Only the tab owner can remove members");
    }

    const targetMembership = await db.query.tabMembers.findFirst({
      where: and(
        eq(tabMembers.tabId, tabId),
        eq(tabMembers.userId, targetId)
      ),
    });
    if (!targetMembership) {
      throw new ResponseError(404, "That person isn't in this tab");
    }
    if (targetMembership.role === "owner") {
      throw new ResponseError(400, "The owner can't be removed from the tab");
    }

    // Block removal if the member has activity here — otherwise their share of
    // existing transactions would orphan the balances. They must be settled /
    // their transactions reassigned first.
    const activity = await db
      .select({ id: transactions.id })
      .from(transactions)
      .leftJoin(
        transactionSplits,
        eq(transactionSplits.transactionId, transactions.id)
      )
      .where(
        and(
          eq(transactions.tabId, tabId),
          or(
            eq(transactions.payerId, targetId),
            eq(transactionSplits.userId, targetId)
          )
        )
      )
      .limit(1);
    if (activity.length > 0) {
      throw new ResponseError(
        400,
        "This member has transactions in the tab and can't be removed yet"
      );
    }

    await db
      .delete(tabMembers)
      .where(
        and(eq(tabMembers.tabId, tabId), eq(tabMembers.userId, targetId))
      );

    const tab = await getTabForUser(tabId, user.id);
    if (!tab) throw new ResponseError(404, "Tab not found");
    return NextResponse.json(TabResponseSchema.parse({ tab }));
  } catch (err) {
    if (err instanceof ResponseError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
