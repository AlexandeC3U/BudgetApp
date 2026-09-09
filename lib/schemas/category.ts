import { z } from "zod";

export const CategoryDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  emoji: z.string(),
  color: z.string(),
});
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;

export const CategoriesResponseSchema = z.object({
  categories: z.array(CategoryDtoSchema),
});
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1).max(40),
  emoji: z.string().min(1).max(8),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

// Every field optional — a PATCH may touch any subset. At least one required.
export const UpdateCategoryInputSchema = CreateCategoryInputSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "No fields to update" }
);
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

export const CategoryResponseSchema = z.object({
  category: CategoryDtoSchema,
});
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
