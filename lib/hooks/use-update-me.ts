"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { currentUserQueryKey, meSummaryQueryKey } from "@/lib/query-keys";
import {
  MeResponseSchema,
  UpdateUserInputSchema,
  type UpdateUserInput,
  type UserDto,
} from "@/lib/schemas/user";

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation<UserDto, Error, UpdateUserInput>({
    mutationFn: async (input) => {
      const validated = UpdateUserInputSchema.parse(input);
      const raw = await apiJson<unknown>("/api/me", {
        method: "PATCH",
        body: JSON.stringify(validated),
      });
      return MeResponseSchema.parse(raw).user;
    },
    onSuccess: () => {
      // Identity shows up on the profile header (me/summary) and as the
      // current-user avatar across tabs/transactions.
      qc.invalidateQueries({ queryKey: currentUserQueryKey });
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
      qc.invalidateQueries({ queryKey: ["tab"] });
      qc.invalidateQueries({ queryKey: ["tabs"] });
    },
  });
}
