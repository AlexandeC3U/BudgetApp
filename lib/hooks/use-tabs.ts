"use client";

import { useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { tabsQueryKey } from "@/lib/query-keys";
import {
  TabsResponseSchema,
  type TabDto,
  type TabsResponse,
} from "@/lib/schemas/tab";

export { tabsQueryKey };

// Module-level stable references so consumers see the same `[]` across
// renders while data is loading — keeps useMemo deps stable.
const EMPTY_TABS: readonly TabDto[] = [] as const;
const EMPTY_TABS_RESPONSE: TabsResponse = { tabs: [] } as const;

export function useTabs() {
  return useQuery<TabsResponse, Error, TabDto[]>({
    queryKey: tabsQueryKey,
    queryFn: async () => {
      const raw = await apiJson<unknown>("/api/tabs");
      // Validate at the boundary so the rest of the app can trust the shape.
      return TabsResponseSchema.parse(raw);
    },
    placeholderData: EMPTY_TABS_RESPONSE,
    select: (data) => (data.tabs.length === 0 ? (EMPTY_TABS as TabDto[]) : data.tabs),
  });
}
