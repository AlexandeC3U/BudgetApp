import type { TransactionDto } from "@/lib/schemas/transaction";

export type Balance = { owed: number; owe: number; net: number };

/**
 * Compute aggregate balances for `currentUserId` across the given transactions.
 * - `owed`: how much others owe the current user (they're in the split, current user paid)
 * - `owe`:  how much the current user owes others (split includes them, someone else paid)
 *
 * Returns zeros if `currentUserId` is undefined (e.g. me-query still loading).
 */
export function computeBalance(
  // Only needs amount/payer/split, so callers (e.g. the server-side me-summary
  // aggregate) can pass minimal rows instead of full TransactionDtos.
  txns: Pick<TransactionDto, "amount" | "payer" | "split">[],
  currentUserId: string | undefined
): Balance {
  if (!currentUserId) return { owed: 0, owe: 0, net: 0 };

  let owed = 0;
  let owe = 0;
  for (const t of txns) {
    const splitCount = Math.max(t.split.length, 1);
    const share = t.amount / splitCount;
    const youInSplit = t.split.includes(currentUserId);
    const youPaid = t.payer === currentUserId;

    if (youPaid && youInSplit) {
      owed += t.amount - share;
    } else if (!youPaid && youInSplit) {
      owe += share;
    } else if (youPaid && !youInSplit) {
      owed += t.amount;
    }
  }
  return { owed, owe, net: owed - owe };
}

export type CategorySpend = {
  cat: string;          // category id
  total: number;
  name: string;
  emoji: string;
  color: string;
};

/**
 * Roll up transactions by category. Skips transactions with no category.
 * If `tabId` is supplied, restricts to that tab.
 */
export function spendByCategory(
  txns: TransactionDto[],
  tabId?: string
): CategorySpend[] {
  const filtered = tabId ? txns.filter((t) => t.tab === tabId) : txns;
  const byCat = new Map<string, CategorySpend>();
  for (const t of filtered) {
    if (!t.category) continue;
    const existing = byCat.get(t.category.id);
    if (existing) {
      existing.total += t.amount;
    } else {
      byCat.set(t.category.id, {
        cat: t.category.id,
        total: t.amount,
        name: t.category.name,
        emoji: t.category.emoji,
        color: t.category.color,
      });
    }
  }
  return [...byCat.values()].sort((a, b) => b.total - a.total);
}
