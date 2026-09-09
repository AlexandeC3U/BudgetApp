import "server-only";

import { and, eq, inArray, sum } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  tabMembers,
  tabs as tabsTable,
  transactions,
  users,
} from "@/lib/db/schema";
import { userTabIds } from "@/lib/queries/membership";
import type { MemberDto, TabDto } from "@/lib/schemas/tab";

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

/**
 * Return every tab the user is a member of, with members + spent rolled up.
 * Used by `GET /api/tabs` and by the home page Server Component for SSR
 * prefetching.
 */
export async function getTabsForUser(userId: string): Promise<TabDto[]> {
  // All three reads are independent — scope each to the caller's tabs via a
  // membership subquery and fire them concurrently (one round-trip instead of
  // four sequential ones).
  const [tabRows, memberRows, spentRows] = await Promise.all([
    db.select().from(tabsTable).where(inArray(tabsTable.id, userTabIds(userId))),
    db
      .select({
        tabId: tabMembers.tabId,
        userId: users.id,
        name: users.name,
        initials: users.initials,
        color: users.avatarColor,
        role: tabMembers.role,
      })
      .from(tabMembers)
      .innerJoin(users, eq(tabMembers.userId, users.id))
      .where(inArray(tabMembers.tabId, userTabIds(userId))),
    db
      .select({ tabId: transactions.tabId, total: sum(transactions.amount) })
      .from(transactions)
      .where(inArray(transactions.tabId, userTabIds(userId)))
      .groupBy(transactions.tabId),
  ]);
  if (tabRows.length === 0) return [];

  const membersByTab = new Map<string, MemberDto[]>();
  for (const m of memberRows) {
    const list = membersByTab.get(m.tabId) ?? [];
    list.push({
      id: m.userId,
      name: m.name,
      initials: m.initials,
      color: m.color,
      role: m.role,
    });
    membersByTab.set(m.tabId, list);
  }

  const spentByTab = new Map<string, number>();
  for (const s of spentRows) {
    spentByTab.set(s.tabId, Number(s.total ?? 0));
  }

  return tabRows.map((t) => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    color: t.color,
    budget: Number(t.budget),
    spent: spentByTab.get(t.id) ?? 0,
    currency: CURRENCY_SYMBOL[t.currency] ?? t.currency,
    members: membersByTab.get(t.id) ?? [],
  }));
}

/**
 * Return a single tab if the user is a member of it, else null.
 * Use for `GET /api/tabs/[id]` and SSR-prefetching the tab detail page.
 */
export async function getTabForUser(
  tabId: string,
  userId: string
): Promise<TabDto | null> {
  const membership = await db.query.tabMembers.findFirst({
    where: and(eq(tabMembers.tabId, tabId), eq(tabMembers.userId, userId)),
  });
  if (!membership) return null;

  const tab = await db.query.tabs.findFirst({
    where: eq(tabsTable.id, tabId),
  });
  if (!tab) return null;

  const memberRows = await db
    .select({
      userId: users.id,
      name: users.name,
      initials: users.initials,
      color: users.avatarColor,
      role: tabMembers.role,
    })
    .from(tabMembers)
    .innerJoin(users, eq(tabMembers.userId, users.id))
    .where(eq(tabMembers.tabId, tabId));

  const [spentRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(eq(transactions.tabId, tabId));

  return {
    id: tab.id,
    name: tab.name,
    emoji: tab.emoji,
    color: tab.color,
    budget: Number(tab.budget),
    spent: Number(spentRow?.total ?? 0),
    currency: CURRENCY_SYMBOL[tab.currency] ?? tab.currency,
    members: memberRows.map((m) => ({
      id: m.userId,
      name: m.name,
      initials: m.initials,
      color: m.color,
      role: m.role,
    })),
  };
}
