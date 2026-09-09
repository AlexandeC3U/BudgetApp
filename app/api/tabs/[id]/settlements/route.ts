import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { settlements, tabMembers, users } from "@/lib/db/schema";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { computeTabBalances } from "@/lib/queries/balances";
import {
  RecordSettlementInputSchema,
  SettlementsResponseSchema,
} from "@/lib/schemas/settlement";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id: tabId } = await params;
    await requireMembership(tabId, user.id);

    const rows = await db.query.settlements.findMany({
      where: eq(settlements.tabId, tabId),
      with: { from: true, to: true },
      orderBy: [desc(settlements.createdAt)],
    });

    const body = SettlementsResponseSchema.parse({
      settlements: rows.map((r) => ({
        id: r.id,
        from: memberFromUser(r.from),
        to: memberFromUser(r.to),
        amount: Number(r.amount),
        date: r.createdAt.toISOString(),
      })),
    });
    return NextResponse.json(body);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id: tabId } = await params;
    await requireMembership(tabId, user.id);

    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = RecordSettlementInputSchema.parse(json);

    if ("all" in input) {
      // Record every outstanding transfer for the tab in one go.
      const { settlements: outstanding } = await computeTabBalances(tabId);
      if (outstanding.length === 0) {
        return NextResponse.json({ ok: true, recorded: 0 });
      }
      await db.insert(settlements).values(
        outstanding.map((s) => ({
          tabId,
          fromUserId: s.from.id,
          toUserId: s.to.id,
          amount: s.amount.toFixed(2),
          createdBy: user.id,
        }))
      );
      return NextResponse.json({ ok: true, recorded: outstanding.length }, { status: 201 });
    }

    // Single payment — validate both parties belong to the tab.
    if (input.fromUserId === input.toUserId) {
      throw new ResponseError(400, "Payer and payee must differ");
    }
    const memberRows = await db.query.tabMembers.findMany({
      where: eq(tabMembers.tabId, tabId),
    });
    const memberIds = new Set(memberRows.map((m) => m.userId));
    if (!memberIds.has(input.fromUserId) || !memberIds.has(input.toUserId)) {
      throw new ResponseError(400, "Both parties must be members of the tab");
    }

    await db.insert(settlements).values({
      tabId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      amount: input.amount.toFixed(2),
      createdBy: user.id,
    });
    return NextResponse.json({ ok: true, recorded: 1 }, { status: 201 });
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

function memberFromUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    initials: u.initials,
    color: u.avatarColor,
  };
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
