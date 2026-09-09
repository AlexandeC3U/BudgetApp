import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  settlements,
  tabMembers,
  transactions,
  users,
} from "@/lib/db/schema";
import type { MemberDto } from "@/lib/schemas/tab";
import type { Settlement } from "@/lib/schemas/balance";

const CENT = 100; // work in cents to dodge floating-point rounding

export type TabBalances = {
  members: MemberDto[];
  netByMember: Array<{ member: MemberDto; net: number }>;
  settlements: Settlement[];
};

/**
 * Compute who owes whom for a tab. Each transaction credits its payer the full
 * amount and debits every split member their (cent-accurate) share. Previously
 * recorded settlement payments are then netted out so paid-down balances don't
 * reappear. The returned `settlements` are the *remaining* suggested transfers,
 * minimised via a greedy biggest-creditor/biggest-debtor pairing.
 *
 * Caller is responsible for authorizing the requester as a tab member.
 */
export async function computeTabBalances(tabId: string): Promise<TabBalances> {
  const memberRows = await db
    .select({
      id: users.id,
      name: users.name,
      initials: users.initials,
      color: users.avatarColor,
      role: tabMembers.role,
    })
    .from(tabMembers)
    .innerJoin(users, eq(tabMembers.userId, users.id))
    .where(eq(tabMembers.tabId, tabId));

  const members: MemberDto[] = memberRows.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    color: m.color,
    role: m.role,
  }));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const txns = await db.query.transactions.findMany({
    where: eq(transactions.tabId, tabId),
    with: { splits: true },
  });

  // Net per member, in cents. Positive = owed money, negative = owes.
  const netCents = new Map<string, number>();
  for (const m of members) netCents.set(m.id, 0);

  for (const t of txns) {
    const totalCents = Math.round(Number(t.amount) * CENT);
    const splitCount = t.splits.length || 1;
    const baseShare = Math.floor(totalCents / splitCount);
    const remainder = totalCents - baseShare * splitCount;

    if (t.payerId && netCents.has(t.payerId)) {
      netCents.set(t.payerId, (netCents.get(t.payerId) ?? 0) + totalCents);
    }
    // Spread the leftover cents one at a time across the first `remainder`
    // split rows (deterministic by db ordering).
    t.splits.forEach((s, i) => {
      if (!netCents.has(s.userId)) return;
      const owe = baseShare + (i < remainder ? 1 : 0);
      netCents.set(s.userId, (netCents.get(s.userId) ?? 0) - owe);
    });
  }

  // Apply recorded payments: when `from` pays `to`, both move toward zero —
  // the debtor's negative net rises, the creditor's positive net falls.
  const settled = await db
    .select({
      fromUserId: settlements.fromUserId,
      toUserId: settlements.toUserId,
      amount: settlements.amount,
    })
    .from(settlements)
    .where(eq(settlements.tabId, tabId));

  for (const s of settled) {
    const cents = Math.round(Number(s.amount) * CENT);
    if (netCents.has(s.fromUserId)) {
      netCents.set(s.fromUserId, (netCents.get(s.fromUserId) ?? 0) + cents);
    }
    if (netCents.has(s.toUserId)) {
      netCents.set(s.toUserId, (netCents.get(s.toUserId) ?? 0) - cents);
    }
  }

  const netByMember = members.map((m) => ({
    member: m,
    net: (netCents.get(m.id) ?? 0) / CENT,
  }));

  // Greedy minimum-transfer settlement on the residual balances.
  const creditors: Array<{ id: string; cents: number }> = [];
  const debtors: Array<{ id: string; cents: number }> = [];
  for (const [id, c] of netCents) {
    if (c > 0) creditors.push({ id, cents: c });
    else if (c < 0) debtors.push({ id, cents: -c });
  }
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const suggestions: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const pay = Math.min(c.cents, d.cents);
    if (pay > 0) {
      const from = memberById.get(d.id);
      const to = memberById.get(c.id);
      if (from && to) {
        suggestions.push({ from, to, amount: pay / CENT });
      }
    }
    c.cents -= pay;
    d.cents -= pay;
    if (c.cents === 0) i++;
    if (d.cents === 0) j++;
  }

  return { members, netByMember, settlements: suggestions };
}
