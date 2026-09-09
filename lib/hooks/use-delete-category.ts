"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { categoriesQueryKey, meSummaryQueryKey } from "@/lib/query-keys";

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, string>({
    mutationFn: async (id) => {
      return apiJson<{ ok: true }>(
        `/api/categories/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesQueryKey });
      // Deleting a category nulls it on past transactions.
      qc.invalidateQueries({ queryKey: ["transactions"] });
      // Profile's category count.
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
    },
  });
}
