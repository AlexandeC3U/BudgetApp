"use client";

import { useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { currentUserQueryKey } from "@/lib/query-keys";
import {
  MeResponseSchema,
  type MeResponse,
  type UserDto,
} from "@/lib/schemas/user";

export { currentUserQueryKey };

export function useCurrentUser() {
  return useQuery<MeResponse, Error, UserDto>({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const raw = await apiJson<unknown>("/api/me");
      return MeResponseSchema.parse(raw);
    },
    select: (data) => data.user,
    staleTime: 5 * 60_000, // user identity rarely changes
  });
}
