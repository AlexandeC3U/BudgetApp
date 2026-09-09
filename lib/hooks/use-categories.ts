"use client";

import { useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import {
  CategoriesResponseSchema,
  type CategoriesResponse,
  type CategoryDto,
} from "@/lib/schemas/category";

import { categoriesQueryKey } from "@/lib/query-keys";
export { categoriesQueryKey };

const EMPTY_CATS: readonly CategoryDto[] = [] as const;
const EMPTY_CATS_RESPONSE: CategoriesResponse = { categories: [] } as const;

export function useCategories() {
  return useQuery<CategoriesResponse, Error, CategoryDto[]>({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      const raw = await apiJson<unknown>("/api/categories");
      return CategoriesResponseSchema.parse(raw);
    },
    placeholderData: EMPTY_CATS_RESPONSE,
    select: (data) =>
      data.categories.length === 0
        ? (EMPTY_CATS as CategoryDto[])
        : data.categories,
  });
}
