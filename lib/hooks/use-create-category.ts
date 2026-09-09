"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { meSummaryQueryKey } from "@/lib/query-keys";
import {
  CategoryResponseSchema,
  CreateCategoryInputSchema,
  type CategoryDto,
  type CreateCategoryInput,
} from "@/lib/schemas/category";

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<CategoryDto, Error, CreateCategoryInput>({
    mutationFn: async (input) => {
      const validated = CreateCategoryInputSchema.parse(input);
      const raw = await apiJson<unknown>("/api/categories", {
        method: "POST",
        body: JSON.stringify(validated),
      });
      return CategoryResponseSchema.parse(raw).category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      // Profile's category count.
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
    },
  });
}
