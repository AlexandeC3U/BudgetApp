"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { categoriesQueryKey } from "@/lib/query-keys";
import {
  CategoryResponseSchema,
  UpdateCategoryInputSchema,
  type CategoryDto,
  type UpdateCategoryInput,
} from "@/lib/schemas/category";

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation<
    CategoryDto,
    Error,
    { id: string; input: UpdateCategoryInput }
  >({
    mutationFn: async ({ id, input }) => {
      const validated = UpdateCategoryInputSchema.parse(input);
      const raw = await apiJson<unknown>(
        `/api/categories/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(validated) }
      );
      return CategoryResponseSchema.parse(raw).category;
    },
    onSuccess: () => {
      // Categories appear on transactions too — refresh both.
      qc.invalidateQueries({ queryKey: categoriesQueryKey });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
