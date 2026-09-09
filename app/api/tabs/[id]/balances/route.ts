import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tabMembers } from "@/lib/db/schema";
import { BalancesResponseSchema } from "@/lib/schemas/balance";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { computeTabBalances } from "@/lib/queries/balances";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser();
    const { id: tabId } = await params;

    // Authorization: caller must be a member of this tab.
    const callerMembership = await db.query.tabMembers.findFirst({
      where: and(eq(tabMembers.tabId, tabId), eq(tabMembers.userId, user.id)),
    });
    if (!callerMembership) throw new ResponseError(403, "Forbidden");

    const { netByMember, settlements } = await computeTabBalances(tabId);
    return NextResponse.json(
      BalancesResponseSchema.parse({ netByMember, settlements })
    );
  } catch (err) {
    if (err instanceof ResponseError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
