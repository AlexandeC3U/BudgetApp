import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getServerQueryClient } from "@/lib/get-query-client";
import { getMeSummary, userToDto } from "@/lib/queries/me";
import { getTabsForUser } from "@/lib/queries/tabs";
import { getDashboardTransactions } from "@/lib/queries/transactions";
import {
  currentUserQueryKey,
  meSummaryQueryKey,
  tabsQueryKey,
  transactionsQueryKey,
} from "@/lib/query-keys";

export default async function HomePage() {
  const qc = getServerQueryClient();

  try {
    const user = await getRequestUser();
    const [tabs, transactions, summary] = await Promise.all([
      getTabsForUser(user.id),
      getDashboardTransactions(user.id),
      getMeSummary(user),
    ]);

    qc.setQueryData(tabsQueryKey, { tabs });
    qc.setQueryData(transactionsQueryKey(), { transactions });
    qc.setQueryData(currentUserQueryKey, { user: userToDto(user) });
    // Drives the balance strip without shipping the full transaction history.
    qc.setQueryData(meSummaryQueryKey, summary);
  } catch (err) {
    // Unauthenticated (Clerk not yet wired + no demo user) — let the client
    // render empty until auth is sorted. Don't surface a 500.
    if (!(err instanceof ResponseError)) throw err;
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DashboardScreen />
    </HydrationBoundary>
  );
}
