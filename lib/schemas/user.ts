import { z } from "zod";

export const UserDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  initials: z.string(),
  color: z.string(),
  email: z.string(),
});
export type UserDto = z.infer<typeof UserDtoSchema>;

export const MeResponseSchema = z.object({
  user: UserDtoSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

// Editable profile fields. `initials` are derived from `name` server-side, so
// the client only sends name + avatar color. At least one field required.
export const UpdateUserInputSchema = z
  .object({
    name: z.string().min(1).max(60),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

// Profile screen rolls user + count badges into one round-trip.
export const MeSummaryResponseSchema = z.object({
  user: UserDtoSchema,
  counts: z.object({
    tabs: z.number().int().nonnegative(),
    transactionsThisMonth: z.number().int().nonnegative(),
    categories: z.number().int().nonnegative(),
  }),
  // Aggregate owed/owe across all the user's tabs (drives the Dashboard strip).
  balance: z.object({
    owed: z.number(),
    owe: z.number(),
    net: z.number(),
  }),
});
export type MeSummaryResponse = z.infer<typeof MeSummaryResponseSchema>;
