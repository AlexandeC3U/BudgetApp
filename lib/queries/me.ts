import "server-only";

import { and, count, eq, gte, inArray, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  categories,
  tabMembers,
  transactions,
  type User,
} from "@/lib/db/schema";
import { userTabIds } from "@/lib/queries/membership";
import { computeBalance, type Balance } from "@/lib/compute";
import type { UserDto } from "@/lib/schemas/user";

export function userToDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    color: user.avatarColor,
    email: user.email,
  };
}

export type MeSummary = {
  user: UserDto;
  counts: {
    tabs: number;
    transactionsThisMonth: number;
    categories: number;
  };
  // Aggregate owed/owe across every tab the user belongs to. Computed here so
  // the Dashboard never has to ship the full transaction history just to render
  // the balance strip. (Settlement-unaware, matching the previous client-side
  // behavior; per-tab settle screens net out recorded payments separately.)
  balance: Balance;
};

/**
 * Compute the badges + balance shown on the profile/dashboard in one round-trip.
 * Every read is independent, so they run concurrently and each scopes itself to
 * the caller's tabs via a membership subquery (no separate id-list fetch).
 */
export async function getMeSummary(user: User): Promise<MeSummary> {
  // Month bounds in UTC; the date column is YYYY-MM-DD so lexicographic
  // string comparison is well-defined.
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}-01`;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthEnd = `${next.getUTCFullYear()}-${String(
    next.getUTCMonth() + 1
  ).padStart(2, "0")}-01`;

  const [tabCountRow, catCountRow, monthCountRow, balanceRows] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(tabMembers)
        .where(eq(tabMembers.userId, user.id)),
      db
        .select({ value: count() })
        .from(categories)
        .where(eq(categories.userId, user.id)),
      db
        .select({ value: count() })
        .from(transactions)
        .where(
          and(
            inArray(transactions.tabId, userTabIds(user.id)),
            gte(transactions.date, monthStart),
            lt(transactions.date, monthEnd)
          )
        ),
      // Balance needs every transaction, but only amount/payer/split — skip the
      // category join and keep the heavy read on the server, shipping just totals.
      db.query.transactions.findMany({
        where: inArray(transactions.tabId, userTabIds(user.id)),
        columns: { amount: true, payerId: true },
        with: { splits: { columns: { userId: true } } },
      }),
    ]);

  const balance: Balance = computeBalance(
    balanceRows.map((r) => ({
      amount: Number(r.amount),
      payer: r.payerId ?? "",
      split: r.splits.map((s) => s.userId),
    })),
    user.id
  );

  return {
    user: userToDto(user),
    counts: {
      tabs: Number(tabCountRow[0].value),
      transactionsThisMonth: Number(monthCountRow[0].value),
      categories: Number(catCountRow[0].value),
    },
    balance,
  };
}
