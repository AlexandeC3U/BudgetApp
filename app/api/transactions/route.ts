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
  CreateTransactionInputSchema,
  CreateTransactionResponseSchema,
  TransactionsResponseSchema,
  type TransactionDto,
} from "@/lib/schemas/transaction";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import {
  getDashboardTransactions,
  getTransactionsForUser,
  getTransactionsPage,
} from "@/lib/queries/transactions";

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser();
    const params = req.nextUrl.searchParams;
    const tabId = params.get("tabId") ?? undefined;

    // If a tabId filter was supplied, authorize membership before delegating.
    if (tabId) {
      const callerMembership = await db.query.tabMembers.findFirst({
        where: and(
          eq(tabMembers.tabId, tabId),
          eq(tabMembers.userId, user.id)
        ),
      });
      if (!callerMembership) throw new ResponseError(403, "Forbidden");
    }

    // Paginated path: opt-in via `?limit=`. Without it, return the full list
    // (Dashboard rollups + SSR + per-tab views still rely on this).
    const limitParam = params.get("limit");
    if (limitParam !== null) {
      const limit = Number.parseInt(limitParam, 10);
      const cursor = params.get("cursor") ?? undefined;
      const page = await getTransactionsPage(user.id, {
        tabId,
        limit: Number.isNaN(limit) ? undefined : limit,
        cursor,
      });
      return NextResponse.json(TransactionsResponseSchema.parse(page));
    }

    // No tabId, no limit → the Dashboard. It only renders "recent + this
    // month", so serve the bounded window rather than the full history. Per-tab
    // views (tabId set) still get the complete list.
    const txns = tabId
      ? await getTransactionsForUser(user.id, { tabId })
      : await getDashboardTransactions(user.id);
    return NextResponse.json(
      TransactionsResponseSchema.parse({ transactions: txns })
    );
  } catch (err) {
    if (err instanceof ResponseError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser();

    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = CreateTransactionInputSchema.parse(json);

    // Authorization: caller must be a member of the tab.
    const callerMembership = await db.query.tabMembers.findFirst({
      where: and(
        eq(tabMembers.tabId, input.tabId),
        eq(tabMembers.userId, user.id)
      ),
    });
    if (!callerMembership) {
      throw new ResponseError(403, "You are not a member of this tab");
    }

    // Verify payer + every split user is a member of the tab.
    const tabMemberRows = await db.query.tabMembers.findMany({
      where: eq(tabMembers.tabId, input.tabId),
    });
    const memberIdSet = new Set(tabMemberRows.map((m) => m.userId));
    if (!memberIdSet.has(input.payerId)) {
      throw new ResponseError(400, "Payer is not a member of the tab");
    }
    for (const uid of input.splitUserIds) {
      if (!memberIdSet.has(uid)) {
        throw new ResponseError(400, "Split user is not a member of the tab");
      }
    }

    // If a category is supplied, ensure it belongs to the caller.
    if (input.categoryId) {
      const cat = await db.query.categories.findFirst({
        where: and(
          eq(categories.id, input.categoryId),
          eq(categories.userId, user.id)
        ),
      });
      if (!cat) {
        throw new ResponseError(400, "Invalid category");
      }
    }

    // Insert transaction + splits atomically.
    const createdId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(transactions)
        .values({
          tabId: input.tabId,
          categoryId: input.categoryId,
          title: input.title,
          amount: input.amount.toFixed(2),
          date: input.date,
          payerId: input.payerId,
          createdBy: user.id,
        })
        .returning({ id: transactions.id });

      // dedupe split user ids (server-side safety net)
      const splitRows = [...new Set(input.splitUserIds)].map((uid) => ({
        transactionId: row.id,
        userId: uid,
      }));
      await tx.insert(transactionSplits).values(splitRows);
      return row.id;
    });

    const fullRow = await db.query.transactions.findFirst({
      where: eq(transactions.id, createdId),
      with: { category: true, splits: true },
    });
    if (!fullRow) {
      throw new ResponseError(500, "Newly created transaction missing");
    }

    const body = CreateTransactionResponseSchema.parse({
      transaction: toTxnDto(fullRow),
    });
    return NextResponse.json(body, { status: 201 });
  } catch (err) {
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
}

type TxnRow = typeof transactions.$inferSelect & {
  category: typeof categories.$inferSelect | null;
  splits: { userId: string }[];
};

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
