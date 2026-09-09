import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { TabDetailScreen } from "@/components/screens/TabDetailScreen";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getServerQueryClient } from "@/lib/get-query-client";
import { userToDto } from "@/lib/queries/me";
import { getTabForUser } from "@/lib/queries/tabs";
import { getTransactionsForUser } from "@/lib/queries/transactions";
import {
  currentUserQueryKey,
  tabQueryKey,
  transactionsQueryKey,
} from "@/lib/query-keys";

export default async function TabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const qc = getServerQueryClient();

  try {
    const user = await getRequestUser();
    qc.setQueryData(currentUserQueryKey, { user: userToDto(user) });

    // getTabForUser doubles as the membership check; only prefetch the tab's
    // transactions once we know the caller is actually a member.
    const tab = await getTabForUser(id, user.id);
    if (tab) {
      const transactions = await getTransactionsForUser(user.id, { tabId: id });
      qc.setQueryData(tabQueryKey(id), { tab });
      qc.setQueryData(transactionsQueryKey(id), { transactions });
    }
  } catch (err) {
    // Unauthenticated — render cold and let the client handle it (mirrors the
    // home page). Anything else is a real error.
    if (!(err instanceof ResponseError)) throw err;
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TabDetailScreen tabId={id} />
    </HydrationBoundary>
  );
}
