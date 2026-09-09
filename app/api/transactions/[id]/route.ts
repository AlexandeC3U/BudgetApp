import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  categories,
  tabMembers,
  transactionSplits,
  transactions,
} from "@/lib/db/schema";
import {
  TransactionResponseSchema,
  UpdateTransactionInputSchema,
  type TransactionDto,
} from "@/lib/schemas/transaction";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;
    const txn = await loadAuthorizedTxn(id, user.id);
    return NextResponse.json(
      TransactionResponseSchema.parse({ transaction: toTxnDto(txn) })
    );
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
    const input = UpdateTransactionInputSchema.parse(json);

    const existing = await loadAuthorizedTxn(id, user.id);

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const cat = await db.query.categories.findFirst({
        where: and(
          eq(categories.id, input.categoryId),
          eq(categories.userId, user.id)
        ),
      });
      if (!cat) throw new ResponseError(400, "Invalid category");
    }

    if (input.splitUserIds) {
      const memberRows = await db.query.tabMembers.findMany({
        where: eq(tabMembers.tabId, existing.tabId),
      });
      const memberIdSet = new Set(memberRows.map((m) => m.userId));
      for (const uid of input.splitUserIds) {
        if (!memberIdSet.has(uid)) {
          throw new ResponseError(
            400,
            "Split user is not a member of this tab"
          );
        }
      }
    }

    await db.transaction(async (tx) => {
      const update: Partial<typeof transactions.$inferInsert> & {
        updatedAt?: Date;
      } = { updatedAt: new Date() };
      if (input.categoryId !== undefined) update.categoryId = input.categoryId;
      if (input.title !== undefined) update.title = input.title;
      if (input.amount !== undefined) update.amount = input.amount.toFixed(2);
      if (input.date !== undefined) update.date = input.date;

      if (Object.keys(update).length > 1) {
        await tx
          .update(transactions)
          .set(update)
          .where(eq(transactions.id, id));
      }

      if (input.splitUserIds) {
        await tx
          .delete(transactionSplits)
          .where(eq(transactionSplits.transactionId, id));
        const splitRows = [...new Set(input.splitUserIds)].map((uid) => ({
          transactionId: id,
          userId: uid,
        }));
        await tx.insert(transactionSplits).values(splitRows);
      }
    });

    const fresh = await loadAuthorizedTxn(id, user.id);
    return NextResponse.json(
      TransactionResponseSchema.parse({ transaction: toTxnDto(fresh) })
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;
    await loadAuthorizedTxn(id, user.id); // 404 / 403 path

    await db.delete(transactions).where(eq(transactions.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

type TxnRow = typeof transactions.$inferSelect & {
  category: typeof categories.$inferSelect | null;
  splits: { userId: string }[];
};

async function loadAuthorizedTxn(id: string, userId: string): Promise<TxnRow> {
  const row = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
    with: { category: true, splits: true },
  });
  if (!row) throw new ResponseError(404, "Transaction not found");

  // Caller must be a member of the transaction's tab.
  const membership = await db.query.tabMembers.findFirst({
    where: and(
      eq(tabMembers.tabId, row.tabId),
      eq(tabMembers.userId, userId)
    ),
  });
  if (!membership) throw new ResponseError(403, "Forbidden");
  return row;
}

function toTxnDto(r: TxnRow): TransactionDto {
  return {
    id: r.id,
    tab: r.tabId,
    category: r.category
      ? {
          id: r.category.id,
          name: r.category.name,
          emoji: r.category.emoji,
          color: r.category.color,
        }
      : null,
    title: r.title,
    amount: Number(r.amount),
    date: r.date,
    payer: r.payerId ?? "",
    split: r.splits.map((s) => s.userId),
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
