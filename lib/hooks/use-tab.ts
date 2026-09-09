"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { apiJson } from "@/lib/api/client";
import { TabDtoSchema, type TabDto } from "@/lib/schemas/tab";

const TabResponseSchema = z.object({ tab: TabDtoSchema });
type TabResponse = z.infer<typeof TabResponseSchema>;

import { tabQueryKey } from "@/lib/query-keys";
export { tabQueryKey };

export function useTab(id: string | undefined) {
  return useQuery<TabResponse, Error, TabDto>({
    queryKey: tabQueryKey(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const raw = await apiJson<unknown>(`/api/tabs/${encodeURIComponent(id!)}`);
      return TabResponseSchema.parse(raw);
    },
    select: (data) => data.tab,
  });
}
