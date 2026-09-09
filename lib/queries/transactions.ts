import "server-only";

import { and, desc, eq, gte, inArray, lt, or } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  categories,
  tabMembers,
  transactions,
} from "@/lib/db/schema";
import { userTabIds } from "@/lib/queries/membership";
import type { TransactionDto } from "@/lib/schemas/transaction";

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

/**
 * Return transactions visible to `userId`. If `tabId` is supplied, the caller
 * must already be confirmed as a member of that tab (caller is responsible for
 * the membership check; this helper just filters). Without `tabId`, returns
 * transactions across every tab the caller belongs to.
 */
export async function getTransactionsForUser(
  userId: string,
  opts: { tabId?: string } = {}
): Promise<TransactionDto[]> {
  let whereClause;
  if (opts.tabId) {
    whereClause = eq(transactions.tabId, opts.tabId);
  } else {
    const memberships = await db
      .select({ tabId: tabMembers.tabId })
      .from(tabMembers)
      .where(eq(tabMembers.userId, userId));
    const tabIds = memberships.map((m) => m.tabId);
    if (tabIds.length === 0) return [];
    whereClause = inArray(transactions.tabId, tabIds);
  }

  const rows = await db.query.transactions.findMany({
    where: whereClause,
    with: { category: true, splits: true },
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
  });

  return rows.map(toTxnDto);
}

// ─────── Dashboard window ───────

// How many recent rows to guarantee even when the window itself is empty, so
// the Dashboard's "Recent" list is never blank for a user who simply hasn't
// spent anything this month/week.
const RECENT_FALLBACK = 6;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Lower bound (YYYY-MM-DD) for the Dashboard's transaction window: the earlier
 * of this month's first day and this week's Monday (the current week can start
 * in the previous month), minus a one-day pad so the client's local-time
 * month/week filtering never sees a gap at the boundary. UTC-based to stay
 * deterministic across server timezones.
 */
function dashboardWindowStart(now = new Date()): string {
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  // Monday-based: getUTCDay() 0=Sun…6=Sat → days elapsed since Monday.
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const start = monthStart < weekStart ? monthStart : weekStart;
  start.setUTCDate(start.getUTCDate() - 1); // pad for timezone skew
  return `${start.getUTCFullYear()}-${pad2(start.getUTCMonth() + 1)}-${pad2(
    start.getUTCDate()
  )}`;
}

/**
 * Transactions the Dashboard actually renders: the current month + current week
 * window, unioned with the latest few rows so "Recent" is always populated.
 * Bounds the payload (and the joined splits/category per row) instead of
 * shipping the whole account history. The all-time owed/owe balance is computed
 * separately server-side via `getMeSummary`.
 */
export async function getDashboardTransactions(
  userId: string
): Promise<TransactionDto[]> {
  const order = [
    desc(transactions.date),
    desc(transactions.createdAt),
    desc(transactions.id),
  ] as const;

  // Scope to the caller's tabs via a membership subquery — no separate round
  // trip to fetch the id list first. An empty membership set just yields no
  // rows, so no explicit guard is needed.
  const rows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.tabId, userTabIds(userId)),
      gte(transactions.date, dashboardWindowStart())
    ),
    with: { category: true, splits: true },
    orderBy: [...order],
  });

  // Window came up short — pull the latest N overall and merge in the rows the
  // window missed, keeping the combined list newest-first.
  if (rows.length < RECENT_FALLBACK) {
    const recent = await db.query.transactions.findMany({
      where: inArray(transactions.tabId, userTabIds(userId)),
      with: { category: true, splits: true },
      orderBy: [...order],
      limit: RECENT_FALLBACK,
    });
    const seen = new Set(rows.map((r) => r.id));
    for (const r of recent) if (!seen.has(r.id)) rows.push(r);
  }

  return rows.map(toTxnDto);
}

// ─────── Cursor pagination ───────

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

type Cursor = { date: string; createdAt: string; id: string };

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      parsed &&
      typeof parsed.date === "string" &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed as Cursor;
    }
  } catch {
    // malformed cursor — treat as no cursor
  }
  return null;
}

export type TransactionsPage = {
  transactions: TransactionDto[];
  nextCursor: string | null;
};

/**
 * Keyset-paginated transactions for `userId`, newest first. Ordered by
 * (date, createdAt, id) descending so the cursor is a stable, gap-free anchor
 * even as new rows are inserted. Without `tabId`, spans every tab the caller
 * belongs to; with `tabId`, the caller must already be authorized as a member.
 */
export async function getTransactionsPage(
  userId: string,
  opts: { tabId?: string; limit?: number; cursor?: string } = {}
): Promise<TransactionsPage> {
  const limit = Math.min(
    Math.max(1, opts.limit ?? DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  let scope;
  if (opts.tabId) {
    scope = eq(transactions.tabId, opts.tabId);
  } else {
    const memberships = await db
      .select({ tabId: tabMembers.tabId })
      .from(tabMembers)
      .where(eq(tabMembers.userId, userId));
    const tabIds = memberships.map((m) => m.tabId);
    if (tabIds.length === 0) return { transactions: [], nextCursor: null };
    scope = inArray(transactions.tabId, tabIds);
  }

  // Keyset predicate: everything strictly "after" the cursor in DESC order.
  const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
  const where = cursor
    ? and(
        scope,
        or(
          lt(transactions.date, cursor.date),
          and(
            eq(transactions.date, cursor.date),
            lt(transactions.createdAt, new Date(cursor.createdAt))
          ),
          and(
            eq(transactions.date, cursor.date),
            eq(transactions.createdAt, new Date(cursor.createdAt)),
            lt(transactions.id, cursor.id)
          )
        )
      )
    : scope;

  // Fetch one extra row to know whether another page exists.
  const rows = await db.query.transactions.findMany({
    where,
    with: { category: true, splits: true },
    orderBy: [
      desc(transactions.date),
      desc(transactions.createdAt),
      desc(transactions.id),
    ],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({
          date: last.date,
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : null;

  return { transactions: pageRows.map(toTxnDto), nextCursor };
}

/**
 * Return a single transaction if the user is a member of its tab, else null.
 */
export async function getTransactionForUser(
  txnId: string,
  userId: string
): Promise<TransactionDto | null> {
  const row = await db.query.transactions.findFirst({
    where: eq(transactions.id, txnId),
    with: { category: true, splits: true },
  });
  if (!row) return null;

  const membership = await db.query.tabMembers.findFirst({
    where: and(
      eq(tabMembers.tabId, row.tabId),
      eq(tabMembers.userId, userId)
    ),
  });
  if (!membership) return null;

  return toTxnDto(row);
}
